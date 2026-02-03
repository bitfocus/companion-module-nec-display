module.exports = {
	initVariables: function () {
		let self = this
		let variables = []

		//variables.push({ variableId: 'model', name: 'Model' });
		//variables.push({ variableId: 'serial', name: 'Serial Number' });

		variables.push({ variableId: 'power', name: 'Power State' })
		variables.push({ variableId: 'input', name: 'Current Input' })
		variables.push({ variableId: 'volume', name: 'Current Volume' })

		self.setVariableDefinitions(variables)
	},

	checkVariables: function () {
		let self = this

		//set variables
		let variableObj = {}

		//variableObj.model = self.data.model;
		//variableObj.serial = self.data.serial;

		variableObj.power = self.data.power == 'on' ? 'On' : 'Off'
		variableObj.input = self.data.input
		variableObj.volume = self.data.volume

		self.setVariableValues(variableObj)
	},
}
