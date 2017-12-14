/* eslint-disable no-magic-numbers, max-statements, max-params */

const fs = require("fs");
const path = require("path");
const os = require("os");

module.exports = (projectName, dataSetName, filename, installPath)=>{
  const bqClient = require("./bq-client.js")(projectName, dataSetName); // eslint-disable-line global-require
  const installerPath = installPath || os.homedir();
  const FAILED_FILE_PATH = path.join(installerPath, filename);
  const MAX_FAILED_LOG_QUEUE = 50;
  const FAILED_LOG_QUEUE_PURGE_COUNT = 10;
  const TEN_MINUTE_MS = 60 * 1000 * 10;
  const FIVE_HOURS_MS = TEN_MINUTE_MS * 6 * 5;
  const INITIAL_FAILED_LOG_RETRY_MS = 10000;
  const PERSIST_FAILURE_DEBOUNCE = 5000;

  let failedLogEntries = {};
  let FAILED_ENTRY_RETRY_MS = TEN_MINUTE_MS;
  let insertPending = null;
  let persistFailuresTimeout = null;

  const addFailedLogEntry = function(tableName, data, date, templateSuffix) {
    if (Object.keys(failedLogEntries).length >= MAX_FAILED_LOG_QUEUE) {purgeOldEntries();}
    failedLogEntries[Number(date)] = [tableName, data, date, templateSuffix];
    schedulePersist();
  };

  const purgeOldEntries = function() {
    Object.keys(failedLogEntries)
      .sort((a, b)=>a - b) // eslint-disable-line id-length
      .slice(0, FAILED_LOG_QUEUE_PURGE_COUNT)
      .forEach((key)=>{
        Reflect.deleteProperty(failedLogEntries, key);
      });
  }

  const insertFailedLogEntries = function() {
    insertPending = null;
    log.file("Inserting failed bq log entries");
    Object.keys(failedLogEntries).reduce((promiseChain, key)=>{
      return promiseChain.then(()=>insert(...failedLogEntries[key]))
        .then(()=>{
          log.file(`inserted ${key}`);
          Reflect.deleteProperty(failedLogEntries, key);
        });
    }, Promise.resolve())
      .catch(()=>{
        log.file("Could not log all previously failed bq logs entries.");
        scheduleLogInsert();
      })
      .then(()=>{
        schedulePersist();
      });
  }

  const scheduleLogInsert = function() {
    if (!insertPending) {
      insertPending = setTimeout(insertFailedLogEntries, FAILED_ENTRY_RETRY_MS);
      FAILED_ENTRY_RETRY_MS = Math.min(FAILED_ENTRY_RETRY_MS * 1.5, FIVE_HOURS_MS);
    }
  }

  const schedulePersist = function() {
    if (persistFailuresTimeout) {clearTimeout(persistFailuresTimeout);}
    persistFailuresTimeout = setTimeout(persistFailures, PERSIST_FAILURE_DEBOUNCE);
  }

  const persistFailures = function() {
    persistFailuresTimeout = null;
    fs.writeFile(FAILED_FILE_PATH, JSON.stringify(failedLogEntries, null, 2), {
      encoding: "utf8"
    }, (err)=>{
      if (err) {
        log.file(`Could not save failed log entries. ${err.message}`);
      }
    });
  }

  const insert = function(tableName, data, date, templateSuffix) {
    return bqClient.insert(tableName, data, date, templateSuffix)
      .catch(err=>{
        addFailedLogEntry(tableName, data, date, templateSuffix);
        scheduleLogInsert();

        return Promise.reject(err);
      });
  }

  const mod = {
    getBQClient() {return bqClient;},
    getDateForTableName(date) {
      const dateVal = new Date(date);
      const year = dateVal.getUTCFullYear();

      let day = dateVal.getUTCDate(),
        month = dateVal.getUTCMonth() + 1;

      if (month < 10) {month = `0${month}`;}
      if (day < 10) {day = `0${day}`;}

      return String(year) + month + day;
    },
    init() {
      try {
        failedLogEntries = require(FAILED_FILE_PATH); // eslint-disable-line global-require
        if (Object.keys(failedLogEntries).length) {
          insertPending = insertPending || setTimeout(insertFailedLogEntries, INITIAL_FAILED_LOG_RETRY_MS);
        }
      } catch (err) {
        failedLogEntries = {};
      }
    },
    log(tableName, data, date, templateSuffix) {
      return insert(tableName, data, date, templateSuffix);
    },
    pendingEntries() {
      return failedLogEntries;
    },
    maxQueue() {
      return MAX_FAILED_LOG_QUEUE;
    }
  };

  return mod;

};
