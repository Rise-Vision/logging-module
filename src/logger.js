const commonConfig = require("common-display-module");

let bqControllers = {};

function validate(entry) {
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

  return error;
}

module.exports = {
  getBQClient(projectName, datasetName) {
    let key = `${projectName}_${datasetName}`;

    if (Object.keys(bqControllers).length !== 0 && bqControllers.hasOwnProperty(key)) {
      return bqControllers[key].getBQClient();
    }

    return null;
  },
  getPendingEntries(projectName, datasetName) {
    let key = `${projectName}_${datasetName}`;

    if (Object.keys(bqControllers).length !== 0 && bqControllers.hasOwnProperty(key)) {
      return bqControllers[key].pendingEntries();
    }

    return 0;
  },
  getMaxQueue(projectName, datasetName) {
    let key = `${projectName}_${datasetName}`;

    if (Object.keys(bqControllers).length !== 0 && bqControllers.hasOwnProperty(key)) {
      return bqControllers[key].maxQueue();
    }

    return 0;
  },
  init(entry){
    let key = `${entry.projectName}_${entry.datasetName}`;

    bqControllers[key] = require("rise-common-electron")
      .bqController(entry.projectName, entry.datasetName, entry.failedEntryFile, commonConfig.getInstallDir());

    bqControllers[key].init();
  },
  log(entry) {
    let entryError = validate(entry);

    if (entryError) {
      return Promise.reject(new Error(entryError));
    }

    let key = `${entry.projectName}_${entry.datasetName}`;
    let nowDate = new Date();

    if (Object.keys(bqControllers).length === 0 || !bqControllers.hasOwnProperty(key)) {
      module.exports.init(entry);
    }

    entry.data.ts = nowDate.toISOString();

    return bqControllers[key].log(entry.table, entry.data, nowDate, entry.suffix)
      .catch((e)=>{
        return Promise.reject(new Error(require("util").inspect(e, { depth: null })));
      });
  },
};
