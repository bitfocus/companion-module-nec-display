const { Regex } = require("@companion-module/base");

module.exports = {
  getConfigFields() {
    return [
      {
        type: "static-text",
        id: "info",
        width: 12,
        label: "Information",
        value: "This module controls Sharp/NEC displays.",
      },
      {
        type: "textinput",
        id: "host",
        label: "IP Address",
        width: 6,
        regex: Regex.IP,
        default: "192.168.1.5",
      },
      {
        type: "textinput",
        id: "port",
        label: "Port",
        width: 6,
        default: 7142,
      },
      {
        type: "dropdown",
        id: "protocol",
        label: "Protocol",
        width: 12,
        default: "hex",
        choices: [
          { id: "ascii", label: "ASCII" },
          { id: "hex", label: "HEX" },
        ],
      },
      {
        type: "checkbox",
        id: "enablePolling",
        label: "Enable Polling",
        width: 6,
        default: true,
      },
      {
        type: "textinput",
        id: "rate",
        label: "Polling Rate (ms)",
        width: 6,
        default: 20000,
        isVisibleExpression: `$(options:enablePolling)`,
      },
      {
        type: "static-text",
        id: "rateinfo",
        width: 12,
        label: "Information",
        value:
          "Some NEC Displays underperformed in testing when using a polling rate of less than 20,000 ms (20 seconds).",
        isVisibleExpression: `$(options:enablePolling) && $(options:rate) < 20000`,
      },
      {
        type: "checkbox",
        id: "verbose",
        label: "Verbose Logging",
        width: 12,
        default: false,
      },
    ];
  },
};
