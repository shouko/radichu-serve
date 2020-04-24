require('dotenv').config();

let radichuCore = {
  apiEndpoint: process.env.RADICHUCORE_API_ENDPOINT,
  metadataEndpoint: process.env.RADICHUCORE_METADATA_ENDPOINT,
  headerPrefix: process.env.RADICHUCORE_HEADER_PREFIX,
  appName: process.env.RADICHUCORE_APPNAME,
  fullKey: process.env.RADICHUCORE_FULLKEY,
};

if (process.env.RADICHUCORE_CONFIG_JSON) {
  radichuCore = {
    ...radichuCore,
    ...JSON.parse(process.env.RADICHUCORE_CONFIG_JSON),
  };
}

module.exports = {
  radichuCore,
  port: process.env.PORT || 0,
  token: process.env.TOKEN,
};
