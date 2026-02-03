const { InstanceStatus, TCPHelper } = require('@companion-module/base')
const hexproto = require('./hexprotocol')

module.exports = {
	initConnection: function () {
		let self = this

		try {
			// Close connection before another is started (hex protocol allows only one concurrent connection)
			if (self.socket) {
				self.socket.destroy()
				delete self.socket
			}
		} catch (error) {
			self.log('debug', `Failed to close connection: ${error}`)
		}

		try {
			self.log('info', `Opening connection to ${self.config.host}:${self.config.port}`)

			self.socket = new TCPHelper(self.config.host, self.config.port)

			self.socket.on('error', function (err) {
				if (self.config.verbose) {
					self.log('warn', 'Error: ' + err)
				}

				self.stopPolling()
				self.updateStatus(InstanceStatus.ConnectionFailure)
				console.log(err)
			})

			self.socket.on('connect', function () {
				self.updateStatus(InstanceStatus.Ok)

				self.getInformation()
				self.startPolling()
			})

			self.socket.on('data', function (buffer) {
				//let indata = buffer.toString();

				self.processData(buffer)
			})
		} catch (error) {
			self.log('error', `Failed to connect to display: ${error}`)
			self.updateStatus(InstanceStatus.ConnectionFailure)
		}
	},

	startPolling: function () {
		let self = this

		self.stopPolling() //clear any existing timer

		if (self.config.enablePolling) {
			self.timer = setInterval(self.getInformation, self.config.rate, self)
		}
	},

	stopPolling: function () {
		let self = this

		if (self.timer) {
			clearInterval(self.timer)
			delete self.timer
		}
	},

	getInformation: async function (scope) {
		let self = scope ? scope : this

		if (self.config.protocol == 'ascii') {
			await self.sendCommand('power ?')
			await self.sendCommand('input ?')
			await self.sendCommand('volume ?')
			await self.sendCommand('avmute audio ?')
		} else if (self.config.protocol == 'hex') {
			if (self.step === undefined) {
				self.step = 0
			}

			if (self.step === 0) await self.sendCommand(hexproto.buildHexCommand(hexproto.MSGTYPE.CMD, '01D6')) // power
			if (self.step === 1) await self.sendCommand(hexproto.buildHexCommand(hexproto.MSGTYPE.GET_PARAM, hexproto.OPPAGE_INPUT + hexproto.OPCODE_INPUT)) // input
			if (self.step === 2) await self.sendCommand(hexproto.buildHexCommand(hexproto.MSGTYPE.GET_PARAM, hexproto.OPPAGE_VOLUME + hexproto.OPCODE_VOLUME)) // volume

			self.step = (self.step + 1) % 3
		}
	},

	sendCommand: async function (command) {
		let self = this

		let hex = command

		if (self.config.verbose) self.log('info', 'Sending command: ' + command)
		if (self.config.protocol == 'ascii') {
			//convert to hexadecimal and send
			hex = Buffer.from(command + '\r', 'ascii')
		} else {
			//hex = parseInt(command, 16);
		}

		await self.socket.send(hex)
	},

	processData: function (data) {
		let self = this

		if (self.config.protocol == 'ascii') {
			//convert hex response to ascii
			let response = data.toString('ascii')

			//self.log('info', 'Processing ASCII data: ' + response);

			let matches = response.match(/>([\w\s]+)\scur=(\w+)/)
			if (matches == null) return
			let command = matches[1]
			let cur = matches[2]

			//console.log('command', command, 'data', cur)

			switch (command) {
				case 'power':
					self.data.power = cur
					self.checkFeedbacks('power')
					break
				case 'input':
					self.data.input = cur
					self.checkFeedbacks('input')
					break
				case 'volume':
					self.data.volume = parseInt(cur)

					break
				case 'avmute audio':
					if (cur === 'on') self.data.audiomute = true
					else self.data.audiomute = false
					self.checkFeedbacks('audiomute')
					break
				default:
					break
			}
			// }
		} else if (self.config.protocol == 'hex') {
			if (self.config.verbose) self.log('info', 'Processing HEX data: ' + data.toString('hex'))
			let response = hexproto.parseData(data)
			if (self.config.verbose) self.log('info', 'Processed response: ' + JSON.stringify(response))

			if (response === undefined) return

			if (response.msgType === hexproto.MSGTYPE.CMD_REPLY) {
				// cmd reply

				const payload = response.payload.join('')
				if (self.config.verbose) self.log('debug', 'CMD Reply payload is: ' + payload)
				if (payload === '30323030443630303030303430303034' || payload === '303043323033443630303034') {
					self.data.power = 'off'
				} else if (payload === '30323030443630303030303430303031' || payload === '303043323033443630303031') {
					self.data.power = 'on'
				}
			} else if (response.msgType === hexproto.MSGTYPE.GET_PARAM_REPLY || response.msgType === hexproto.MSGTYPE.SET_PARAM_REPLY) {
				// get parameter reply

				const replyData = hexproto.parseGetSetParamReply(response.payload)
				if (self.config.verbose) self.log('debug', 'PARAM Reply payload is: ' + JSON.stringify(replyData))

				if (replyData.success !== true) {
					self.log('warn', `Get/Set Param failed: OP Page ${replyData.opPage}, OP Code ${replyData.opCode}, Value ${replyData.value}`)
				} else {
					if (replyData.opPage == hexproto.OPPAGE_INPUT && replyData.opCode == hexproto.OPCODE_INPUT) {
						// input
						self.data.input = hexproto.getMappedInput(replyData.value)
					} else if (replyData.opPage == hexproto.OPPAGE_VOLUME && replyData.opCode == hexproto.OPCODE_VOLUME) {
						// volume
						self.data.volume = replyData.value
					} else if (replyData.opPage == hexproto.OPPAGE_AUDIOMUTE && replyData.opCode == hexproto.OPCODE_AUDIOMUTE) {
						// audio mute
						self.data.audiomute = replyData.value === 1
					}
				}
			}
			self.checkFeedbacks()
		}
		self.checkVariables()
	},

	setPower: async function (inpower) {
		let self = this
		let power = 'on'

		if (inpower === 'toggle' && self.data.power === 'on') {
			power = 'off'
		} else if (inpower === 'toggle') {
			power = 'on'
		} else {
			power = inpower
		}

		if (self.config.protocol == 'ascii') {
			await self.sendCommand('power ' + power)
		} else if (self.config.protocol == 'hex') {
			let cmd = hexproto.buildHexCommand(hexproto.MSGTYPE.CMD, 'C203D6000' + (power === 'on' ? '1' : '4'))
			await self.sendCommand(cmd)
		}
	},

	setInput: async function (input) {
		let self = this

		if (self.config.protocol == 'ascii') {
			await self.sendCommand('input ' + input)
		} else if (self.config.protocol == 'hex') {
			let cmd = ''
			switch (input) {
				case 'vga':
					cmd = '0001'
					break
				case 'rgbhv':
					cmd = '0002'
					break
				case 'dvi':
					cmd = '0003'
					break
				case 'hdmi1':
					cmd = '0004'
					break // hdmi1 reads with 0017, but set only works with 0004 (on P461)
				case 'video1':
					cmd = '0005'
					break
				case 'video2':
					cmd = '0006'
					break
				case 'svideo':
					cmd = '0007'
					break
				case 'tva':
					cmd = '0009'
					break
				case 'tvd':
					cmd = '0010'
					break
				case 'dvdhd1':
					cmd = '0012'
					break
				case 'option':
					cmd = '0013'
					break
				case 'dvdhd2':
					cmd = '0014'
					break
				case 'displayport1':
					cmd = '0015'
					break
				case 'displayport2':
					cmd = '0016'
					break
				case 'hdmi2':
					cmd = '0018'
					break
				default:
					break
			}

			if (cmd !== '') {
				cmd = hexproto.buildHexCommand(hexproto.MSGTYPE.SET_PARAM, hexproto.OPPAGE_INPUT + hexproto.OPCODE_INPUT + cmd)
				await self.sendCommand(cmd)
			}
		}
	},

	setVolume: async function (volume) {
		let self = this

		if (self.config.protocol == 'ascii') {
			await self.sendCommand('volume ' + volume)
		} else if (self.config.protocol == 'hex') {
			let cmd = hexproto.buildHexCommand(hexproto.MSGTYPE.SET_PARAM, hexproto.OPPAGE_VOLUME + hexproto.OPCODE_VOLUME + volume.toString(16).padStart(4, '0'))
			await self.sendCommand(cmd)
		}
	},

	setAudioMute: async function (mute) {
		let self = this

		if (self.data.audiomute !== true && self.data.audiomute !== false) {
			self.data.audiomute = false
		}

		if (mute === 'toggle') {
			if (self.data.audiomute) {
				self.data.audiomute = false
			} else {
				self.data.audiomute = true
			}
		} else {
			switch (mute) {
				case 'on':
					self.data.audiomute = true
					break
				case 'off':
					self.data.audiomute = false
					break
			}
		}

		if (self.config.protocol == 'ascii') {
			await self.sendCommand(`avmute audio  ${self.data.audiomute ? 'on' : 'off'}`)
		} else if (self.config.protocol == 'hex') {
			let cmd = hexproto.buildHexCommand(hexproto.MSGTYPE.SET_PARAM, hexproto.OPPAGE_AUDIOMUTE + hexproto.OPCODE_AUDIOMUTE + (self.data.audiomute ? 1 : 0).toString(16).padStart(4, '0'))
			await self.sendCommand(cmd)
		}
	},

	getInputChoices: function (protocol) {
		if (protocol === 'ascii') {
			return [
				{ id: 'hdmi1', label: 'HDMI1' },
				{ id: 'hdmi2', label: 'HDMI2' },
				{ id: 'hdmi3', label: 'HDMI3' },
				{ id: 'displayport1', label: 'Display Port 1' },
				{ id: 'displayport2', label: 'Display Port 2' },
				{ id: 'displayport3', label: 'Display Port 3' },
				{ id: 'mp', label: 'MP' },
				{ id: 'compute_module', label: 'Compute Module' },
				{ id: 'option', label: 'Option' },
			]
		} else if (protocol === 'hex') {
			return hexproto.getInputChoices()
		}

		return []
	},
}
