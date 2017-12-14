const network = require("rise-common-electron").network;
const config = require("../../src/config/config");

module.exports = (projectName, dataSetName, refreshUrl)=>{
  const sixtyMins = 3580000;

  let refreshDate = 0,
    token = "";

  const refreshToken = function(nowDate) {
    if (nowDate - refreshDate < sixtyMins) {
      return Promise.resolve(token);
    }

    return network.httpFetch(refreshUrl || config.refreshUrl, {method: "POST"})
    .then(resp=>{return resp.json();})
    .then(json=>{
      refreshDate = nowDate;
      token = json.access_token;
    });
  };

  const mod = {
    refreshToken,
    insert(tableName, data, nowDate, templateSuffix) { // eslint-disable-line max-params
      if (!projectName) {return Promise.reject("projectName is required");}
      if (!dataSetName) {return Promise.reject("dataSetName is required");}
      if (!tableName) {return Promise.reject("tableName is required");}

      nowDate = nowDate || new Date(); // eslint-disable-line no-param-reassign

      return mod.refreshToken(nowDate).then(()=>{
        const insertData = JSON.parse(JSON.stringify(config.insertSchema));
        const row = insertData.rows[0];

        if (templateSuffix) {
          insertData.templateSuffix = templateSuffix;
        }

        const serviceUrl = config.serviceUrl
          .replace("PROJECT_NAME", projectName)
          .replace("DATA_SET", dataSetName)
          .replace("TABLE_ID", tableName);

        const headers = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        };

        row.insertId = Math.random().toString(36).substr(2).toUpperCase(); // eslint-disable-line no-magic-numbers
        row.json = data;

        return network.httpFetch(serviceUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(insertData)
        })
        .then((res)=>{
          return res.json();
        })
        .then((json)=>{
          if (!json.insertErrors || json.insertErrors.length === 0) {return Promise.resolve();}
          return Promise.reject(json.insertErrors);
        });
      });
    }
  };

  return mod;
};
