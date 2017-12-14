/* eslint-disable global-require */

const commonConfig = require("common-display-module");

const bqControllers = {};

const validate = function(entry) {
  let error = "";

  if (!entry) {
    error = "Entry is required";
  } else if (!entry.projectName) {
    error = "BQ project name is required";
  } else if (!entry.datasetName) {
    error = "BQ dataset name is required";
  } else if (!entry.failedEntryFile) {
    error = "BQ failed entry file is required";
  } else if (!entry.table) {
    error = "BQ table is required";
  } else if (!entry.data) {
    error = "BQ data is required";
  }

  return error;
};

module.exports = {
  getBQClient(projectName, datasetName) {
    const key = `${projectName}_${datasetName}`;

    if (Object.keys(bqControllers).length !== 0 && Object.prototype.hasOwnProperty.call(bqControllers, key)) {
      return bqControllers[key].getBQClient();
    }

    return null;
  },
  getPendingEntries(projectName, datasetName) {
    const key = `${projectName}_${datasetName}`;

    if (Object.keys(bqControllers).length !== 0 && Object.prototype.hasOwnProperty.call(bqControllers, key)) {
      return bqControllers[key].pendingEntries();
    }

    return 0;
  },
  getMaxQueue(projectName, datasetName) {
    const key = `${projectName}_${datasetName}`;

    if (Object.keys(bqControllers).length !== 0 && Object.prototype.hasOwnProperty.call(bqControllers, key)) {
      return bqControllers[key].maxQueue();
    }

    return 0;
  },
  init(entry) {
    const key = `${entry.projectName}_${entry.datasetName}`;

    bqControllers[key] = require("./bq/bq-controller")(entry.projectName, entry.datasetName, entry.failedEntryFile, commonConfig.getInstallDir());

    bqControllers[key].init();
  },
  log(entry) {
    const entryError = validate(entry);

    if (entryError) {
      return Promise.reject(new Error(entryError));
    }

    const key = `${entry.projectName}_${entry.datasetName}`;
    const nowDate = new Date();

    if (Object.keys(bqControllers).length === 0 || !Object.prototype.hasOwnProperty.call(bqControllers, key)) {
      module.exports.init(entry);
    }

    entry.data.ts = nowDate.toISOString();

    return bqControllers[key].log(entry.table, entry.data, nowDate, entry.suffix)
      .catch((err)=>{
        return Promise.reject(new Error(require("util").inspect(err, {depth: null})));
      });
  }
};
