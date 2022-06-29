require("pretty-error").start();
var amqp = require("amqplib");
const log = require("log4js").getLogger("util-rabbitConn");
log.level = "info";

async function rabbitConn() {
  try {
    const connection = await amqp.connect("amqp://localhost:5672");
    connection.on("error", function (err) {
      log.error("AMQP:Error:", err);
    });
    connection.on("close", () => {
      log.info("AMQP:Closed");
    });
    return connection;
  } catch (err) {
    log.error(err);
  }
}

module.exports = rabbitConn;
