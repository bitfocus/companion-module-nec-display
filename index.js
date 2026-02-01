const {
  InstanceBase,
  InstanceStatus,
  runEntrypoint,
} = require("@companion-module/base");
const UpgradeScripts = require("./src/upgrades");

const config = require("./src/config");
const actions = require("./src/actions");
const feedbacks = require("./src/feedbacks");
const variables = require("./src/variables");
const presets = require("./src/presets");

const utils = require("./src/utils");

class necDisplayInstance extends InstanceBase {
  constructor(internal) {
    super(internal);

    // Assign the methods from the listed files to this class
    Object.assign(this, {
      ...config,
      ...actions,
      ...feedbacks,
      ...variables,
      ...presets,
      ...utils,
    });

    this.timer = undefined; //used for polling the device
    this.display = undefined; //used for the connection

    this.data = {
      model: "",
      serial: "",
      power: "off",
      input: "",
      volume: 0,
      audiomute: false,
    };
  }

  async destroy() {
    this.stopPolling();
    try {
      // Close connection before another is started (hex protocol allows only one concurrent connection)
      if (this.socket) {
        this.socket.destroy();
        delete this.socket;
      }
    } catch (error) {
      this.log("debug", `Failed to close connection: ${error}`);
    }
  }

  async init(config) {
    this.configUpdated(config);
  }

  async configUpdated(config) {
    this.config = config;

    this.initActions();
    this.initFeedbacks();
    this.initVariables();
    this.initPresets();

    this.updateStatus(InstanceStatus.Connecting);

    this.initConnection();
  }
}

runEntrypoint(necDisplayInstance, UpgradeScripts);
