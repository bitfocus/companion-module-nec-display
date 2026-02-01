module.exports = {
  SOH: "\x01",
  STX: "\x02",
  ETX: "\x03",
  DEL: "\x0d",

  MSGTYPE: {
    CMD: "\x41",
    CMD_REPLY: "\x42",
    GET_PARAM: "\x43",
    GET_PARAM_REPLY: "\x44",
    SET_PARAM: "\x45",
    SET_PARAM_REPLY: "\x46",
  },

  OPPAGE_INPUT: "00",
  OPCODE_INPUT: "60",

  OPPAGE_VOLUME: "00",
  OPCODE_VOLUME: "62",

  OPPAGE_AUDIOMUTE: "00",
  OPCODE_AUDIOMUTE: "8D",

  INPUT_CHOICES: [
    { id: "vga", label: "VGA", values: [1] },
    { id: "rgbhv", label: "RGB/HV", values: [2] },
    { id: "dvi", label: "DVI", values: [3] },
    { id: "hdmi1", label: "HDMI", values: [4, 17] },
    { id: "video1", label: "Video1", values: [5] },
    { id: "video2", label: "Video2", values: [6] },
    { id: "svideo", label: "S-Video", values: [7] },
    { id: "tva", label: "TV (A)", values: [9] },
    { id: "tvd", label: "TV (D)", values: [10] },
    { id: "dvdhd1", label: "DVD/HD1", values: [12] },
    { id: "option", label: "Option", values: [13] },
    { id: "dvdhd2", label: "DVD/HD2", values: [14] },
    { id: "displayport1", label: "Display Port 1", values: [15] },
    { id: "displayport2", label: "Display Port 2", values: [16] },
    { id: "hdmi2", label: "HDMI 2", values: [18] },
  ],

  hex16String: function (arr, start) {
    if (!arr.length || arr.length < start + 2) return "";
    return (
      String.fromCharCode(parseInt(arr[start], 16)) +
      String.fromCharCode(parseInt(arr[start + 1], 16))
    );
  },

  hex16Value: function (arr, start) {
    const self = this;
    return parseInt(self.hex16String(arr, start), 16);
  },

  hex32String: function (arr, start) {
    if (!arr.length || arr.length < start + 4) return "";
    return (
      String.fromCharCode(parseInt(arr[start], 16)) +
      String.fromCharCode(parseInt(arr[start + 1], 16)) +
      String.fromCharCode(parseInt(arr[start + 2], 16)) +
      String.fromCharCode(parseInt(arr[start + 3], 16))
    );
  },

  hex32Value: function (arr, start) {
    const self = this;
    return parseInt(self.hex32String(arr, start), 16);
  },

  buildHexCommand: function (msgType, payload) {
    const self = this;

    const destination = "\x41";
    const sender = "\x30";

    let cmd = "\x30" + destination + sender + msgType;

    const msgLength = (payload.length + 2).toString(16).padStart(2, "0");
    cmd += msgLength;

    cmd += self.STX;
    cmd += payload;
    cmd += self.ETX;

    let checksum = 0;
    for (let i = 0; i < cmd.length; i++) {
      checksum = checksum ^ cmd.charCodeAt(i);
    }

    return self.SOH + cmd + String.fromCharCode(checksum) + self.DEL;
  },

  parseData: function (data) {
    const self = this;

    if (data === undefined) {
      return undefined;
    } /*  else if (data instanceof Buffer) {
      return undefined;
    } */

    // process hex responses here
    let hex = data.toString("hex").toLowerCase();

    // split the hex string every 2 characters into an array
    let hexArray = hex.match(/.{1,2}/g);

    if (data.length > 1 && data[0] === 0x01 && data[1] === 0x30) {
      // normal paket start

      // soh + reserved + dest + src + type + len (2) -> 7
      if (data.length < 7) {
        return undefined;
      }

      const msg_length = self.hex16Value(hexArray, 5);
      const expected_length = 7 + 2 + msg_length;
      if (data.length < expected_length) {
        self.previous_hex = hex;
        return undefined;
      }
    } else if (self.previous_hex !== undefined) {
      hex = self.previous_hex + hex;
      hexArray = hex.match(/.{1,2}/g);

      self.previous_hex = undefined;
    } else {
      return undefined;
    }

    const msgType = String.fromCharCode(parseInt(hexArray[4], 16));

    // find STX and ETX in the array
    const stxIndex = hexArray.indexOf("02");
    const etxIndex = hexArray.indexOf("03");

    if (stxIndex === -1 || etxIndex === -1) {
      return undefined;
    }

    const payloadArray = hexArray.slice(stxIndex + 1, etxIndex);

    return {
      msgType: msgType,
      payload: payloadArray,
    };
  },

  parseGetSetParamReply: function (payloadArray) {
    const self = this;

    const success = self.hex16String(payloadArray, 0) === "00";
    const opPage = self.hex16String(payloadArray, 2);
    const opCode = self.hex16String(payloadArray, 4);

    const current_value = self.hex32Value(
      payloadArray,
      payloadArray.length - 4,
    );

    return {
      success: success,
      opPage: opPage,
      opCode: opCode,
      value: current_value,
    };
  },

  getMappedInput: function (value) {
    const self = this;

    for (const choice of self.INPUT_CHOICES) {
      if (choice.values.includes(value)) {
        return choice.id;
      }
    }
    return "";
  },

  getInputChoices: function () {
    const self = this;

    const result = [];
    for (const choice of self.INPUT_CHOICES) {
      result.push({ id: choice.id, label: choice.label });
    }
    return result;
  },
};
