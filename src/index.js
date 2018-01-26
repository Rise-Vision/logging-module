const logger = require("./logger");
const config = require("./config/config");
const commonConfig = require("common-display-module");
const messaging = require("common-display-module/messaging");

const modulePath = commonConfig.getModulePath(config.moduleName);
const baseBytes = 10;
const expo = 5;
const maxFileSizeBytes = Math.pow(baseBytes, expo);

global.log = require("rise-common-electron").logger(null, modulePath, config.moduleName);

log.resetLogFiles(maxFileSizeBytes);

messaging.receiveMessages(config.moduleName).then((receiver) => {

  receiver.on("message", (message) => {
    if (message.topic === "log") {
      logger.log(message.data)
        .catch((err)=>{
          log.debug(err.message);
        });
    }
  });

});
