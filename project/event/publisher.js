require("pretty-error").start();
const log = require("log4js").getLogger("publisher");
log.level = "info";

async function publish(dataObj) {
  const { stream } = dataObj;

  log.info("sent ✈️", dataObj);
}

module.exports = publish;
