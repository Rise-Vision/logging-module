let bqController = null;

module.exports = {
  log(entry) {

    let error = "";
    if(!entry){
      error = "Entry is required";
    } else if(!entry.projectName) {
      error = "BQ project name is required";
    } else if(!entry.datasetName) {
      error = "BQ dataset name is required";
    } else if(!entry.failedEntryFile) {
      error = "BQ failed entry file is required";
    } else if(!entry.table) {
      error = "BQ table is required";
    } else if(!entry.data) {
      error = "BQ data is required";
    }

    if (error) {
      return Promise.reject(new Error(error));
    }

    bqController = require("rise-common-electron")
      .bqController(entry.projectName, entry.datasetName, entry.failedEntryFile, "./");

    bqController.init();
    return bqController.log(entry.table, entry.data, new Date())
      .catch((e)=>{
        return Promise.reject(new Error(require("util").inspect(e, { depth: null })));
      });
  },
  pendingEntries() { return (bqController)? bqController.pendingEntries() : 0; },
  maxQueue() { return (bqController)? bqController.maxQueue() : 0; }
};
