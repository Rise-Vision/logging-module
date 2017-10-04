const ipc = require("node-ipc");
const logger = require("./logger");

global.log = global.log || {error:console.log,debug:console.log};

ipc.config.id   = "logging-module";
ipc.config.retry= 1500;

ipc.connectTo(
    "ms",
    function(){
        ipc.of.ms.on(
            "connect",
            function(){
                ipc.log("## connected to ms ##".rainbow, ipc.config.delay);
              }
        );
        ipc.of.ms.on(
            "disconnect",
            function(){
                ipc.log("disconnected from ms".notice);
            }
        );
        ipc.of.ms.on(
            "message",
            function(data){
                ipc.log("got a message from ms : ".debug, data);
                if(data.message === "log") {
                  logger.log(data.entry)
                    .catch((error)=>{
                        log.error(`Could not log to BQ: ${error.message}`);
                    });
                }
            }
        );
    }
);
