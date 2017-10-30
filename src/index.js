const logger = require("./logger");
const commonConfig = require("common-display-module");

let debugging = process.argv.slice(1).join(" ").indexOf("debug") > -1,
  debug = (debugging ? (msg)=>{console.log(msg);} : ()=>{});

commonConfig.receiveMessages("logger").then((receiver) => {

  receiver.on("message", (message) => {
    switch(message.topic) {
      case "log":
        debug(JSON.stringify(message.data));

        logger.log(message.data)
          .catch((e)=>{
            debug(e);
          });
        break;
    }
  });

});
