const assert = require("assert"),
simpleMock = require("simple-mock"),
mock = simpleMock.mock,
riseCommonElectron = require("rise-common-electron"),
logger = require("../../src/logger"),
bqController = {init: ()=>{}, log: ()=>{}};

let entry = null;

describe("Installer logger", () => {

  beforeEach("setup", ()=> {
    mock(riseCommonElectron, "bqController").returnWith(bqController);
    entry = {
      projectName: "projectName",
      datasetName: "datasetName",
      failedEntryFile: "failedEntryFile",
      table: "table",
      data: {}
    };
  });

  afterEach(()=>{
    simpleMock.restore();
  });

  it("should log an entry", function() {

    mock(bqController,"log").resolveWith();
    mock(bqController,"init").resolveWith();

    return logger.log(entry)
      .then(()=>{
        assert.deepEqual(riseCommonElectron.bqController.lastCall.args, [entry.projectName, entry.datasetName,entry.failedEntryFile, "./"]);
        assert(bqController.init.called);
        assert.ok((bqController.log.lastCall.args.includes(entry.table) && bqController.log.lastCall.args.includes(entry.data)));
      });
  });

  it("should resolve to an error if no entry is null", function() {
    entry = null;

    return logger.log(entry)
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
