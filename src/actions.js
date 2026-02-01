module.exports = {
  initActions: function () {
    let self = this;
    let actions = {};

    actions.setPower = {
      name: "Power",
      options: [
        {
          type: "dropdown",
          label: "Power",
          id: "power",
          default: "on",
          choices: [
            { id: "on", label: "On" },
            { id: "off", label: "Off" },
            { id: "toggle", label: "Toggle" },
          ],
        },
      ],
      callback: async function (action) {
        self.setPower(action.options.power);
      },
    };

    const inputChoices = self.getInputChoices(self.config.protocol);
    actions.setInput = {
      name: "Set Input",
      options: [
        {
          type: "dropdown",
          label: "Input",
          id: "input",
          default: inputChoices.length > 0 ? inputChoices[0].id : "",
          choices: inputChoices,
        },
      ],
      callback: async function (action) {
        self.setInput(action.options.input);
      },
    };

    actions.setVolume = {
      name: "Set Volume",
      options: [
        {
          type: "number",
          label: "Volume",
          id: "volume",
          min: 0,
          max: 100,
          default: 50,
          required: true,
          range: false,
          regex: self.REGEX_NUMBER,
        },
      ],
      callback: async function (action) {
        self.setVolume(action.options.volume);
      },
    };

    actions.setAudioMute = {
      name: "Set Audio Mute",
      options: [
        {
          type: "dropdown",
          label: "Mute",
          id: "mute",
          choices: [
            { id: "on", label: "Mute" },
            { id: "off", label: "Unmute" },
            { id: "toggle", label: "Toggle" },
          ],
          default: "toggle",
        },
      ],
      callback: async function (action) {
        self.setAudioMute(action.options.mute);
      },
    };

    self.setActionDefinitions(actions);
  },
};
