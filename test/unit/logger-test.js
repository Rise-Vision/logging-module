/* eslint-env mocha */
/* eslint-disable max-statements, no-magic-numbers, global-require */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const simpleMock = require("simple-mock");
const mock = simpleMock.mock;
const commonConfig = require("common-display-module");

let bqClient = null;
let entry = null
let logger = null;

describe("Logger", ()=>{
  beforeEach(()=>{
    entry = {
      projectName: "projectName",
      datasetName: "datasetName",
      failedEntryFile: "failedEntryFile",
      table: "table",
      data: {
        event: "info",
        event_details: "test info",
        error_details: "",
        display_id: "abc123"
      },
      suffix: "20171030"
    };

    mock(commonConfig, "getInstallDir").returnWith("test_dir");
    mock(log, "file").returnWith();

    logger = require("../../src/logger");
    // necessary for tests to be able to mock the bqClient
    logger.init(entry);

    bqClient = logger.getBQClient(entry.projectName, entry.datasetName);
  });

  afterEach(()=>{
    simpleMock.restore();
  });

  it("successfully inserts event data", ()=>{
    mock(bqClient, "insert").resolveWith();
    mock(logger, "init");

    return logger.log(entry)
      .then(()=>{
        assert.equal(logger.init.callCount, 0);
        assert(bqClient.insert.called);
        assert.equal(bqClient.insert.firstCall.args[0], entry.table);
        assert.equal(bqClient.insert.firstCall.args[1].event, entry.data.event);
        assert(Object.prototype.hasOwnProperty.call(bqClient.insert.firstCall.args[1], "ts"));
        assert(bqClient.insert.firstCall.args[3], entry.suffix);
      });
  });

  it("adds failed log entries on insert failure", ()=>{
    before(()=>{
      try {
        fs.unlinkSync(path.join(commonConfig.getInstallDir(), entry.failedEntryFile));
      } catch (err) {
        console.log(err);
      }
    });

    after(()=>{
      try {
        fs.unlinkSync(path.join(commonConfig.getInstallDir(), entry.failedEntryFile));
      } catch (err) {
        console.log(err);
      }
    });

    mock(bqClient, "insert").rejectWith();

    return logger.log(entry)
      .catch(()=>{
        assert.equal(Object.keys(logger.getPendingEntries(entry.projectName, entry.datasetName)).length, 1);
      });
  });

  it("should resolve to an error if no entry is null", function() {
    return logger.log(null)
      .catch((err)=>{
        assert.equal(err.message, "Entry is required");
      });
  });

  it("should resolve to an error if no entry.projectName is null", function() {
    entry.projectName = null;

    return logger.log(entry)
      .catch((err)=>{
        assert.equal(err.message, "BQ project name is required");
      });
  });

  it("should resolve to an error if no entry.datasetName is null", function() {
    entry.datasetName = null;

    return logger.log(entry)
      .catch((err)=>{
        assert.equal(err.message, "BQ dataset name is required");
      });
  });

  it("should resolve to an error if no entry.failedEntryFile is null", function() {
    entry.failedEntryFile = null;

    return logger.log(entry)
      .catch((err)=>{
        assert.equal(err.message, "BQ failed entry file is required");
      });
  });

  it("should resolve to an error if no entry.table is null", function() {
    entry.table = null;

    return logger.log(entry)
      .catch((err)=>{
        assert.equal(err.message, "BQ table is required");
      });
  });

  it("should resolve to an error if no entry.data is null", function() {
    entry.data = null;

    return logger.log(entry)
      .catch((err)=>{
        assert.equal(err.message, "BQ data is required");
      });
  });

});
