require("pretty-error").start();
const { Kafka, Partitioners } = require("kafkajs");
const log = require("log4js").getLogger("publisher");
log.level = "info";

// * Kafka Cred
const kafka = new Kafka({
  clientId: "auth",
  brokers: ["127.0.0.1:9092"],
});
const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

async function publish(dataObj) {
  try {
    const { topic } = dataObj;
    const timestamp = Date.now();

    await producer.connect();
    await producer.send({
      topic,
      messages: [{ key: timestamp.toString(), value: JSON.stringify(dataObj) }],
    });

    await producer.disconnect();
    log.info("sent ✈️", dataObj);
  } catch (err) {
    log.error(err);
    return;
  }
}

module.exports = publish;
