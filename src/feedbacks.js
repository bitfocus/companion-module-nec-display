const { combineRgb } = require("@companion-module/base");

module.exports = {
  initFeedbacks: function () {
    let self = this;
    let feedbacks = {};

    const foregroundColor = combineRgb(255, 255, 255); // White
    const backgroundColorRed = combineRgb(255, 0, 0); // Red

    feedbacks.power = {
      type: "boolean",
      name: "Power is in X State",
      description: "Change colors of the bank if the Power is in X State",
      defaultStyle: {
        color: foregroundColor,
        bgcolor: backgroundColorRed,
      },
      options: [
        {
          type: "dropdown",
          label: "Power State",
          id: "power",
          default: "on",
          choices: [
            { id: "on", label: "On" },
            { id: "off", label: "Off" },
          ],
        },
      ],
      callback: function (feedback) {
        if (self.data.power == feedback.options.power) {
          return true;
        }

        return false;
      },
    };

    const inputChoices = self.getInputChoices(self.config.protocol);
    feedbacks.input = {
      type: "boolean",
      name: "Input is Selected",
      description: "Change colors of the bank if the Input is selected",
      defaultStyle: {
        color: foregroundColor,
        bgcolor: backgroundColorRed,
      },
      options: [
        {
          type: "dropdown",
          label: "Input",
          id: "input",
          default: inputChoices.length > 0 ? inputChoices[0].id : "",
          choices: inputChoices,
        },
      ],
      callback: function (feedback) {
        if (self.data.input === feedback.options.input) {
          return true;
        }

        return false;
      },
    };

    feedbacks.audiomute = {
      type: "boolean",
      name: "Audio is Muted",
      description: "Change colors of the bank if the volume is muted",
      defaultStyle: {
        color: foregroundColor,
        bgcolor: backgroundColorRed,
      },
      options: [],
      callback: function (_feedback) {
        if (self.data.audiomute === true) {
          return true;
        }

        return false;
      },
    };

    self.setFeedbackDefinitions(feedbacks);
  },
};
