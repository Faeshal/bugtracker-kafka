require("pretty-error").start();
const Notif = require("../models/Notif");
const { Kafka } = require("kafkajs");
const _ = require("underscore");
const log = require("log4js").getLogger("consumer");
log.level = "info";

// * Kafka Cred
const kafka = new Kafka({
  clientId: "notif",
  brokers: ["127.0.0.1:9092"],
});

const consumer = kafka.consumer({ groupId: "notif" });

// * Processor / Job
const newNotifProcess = async (message) => {
  log.info("incoming data 📩:", message);
  // * business logic
  let finalObj = _.omit(message, "topic");
  const notif = await Notif.findOne(finalObj);
  if (!notif) {
    await Notif.create(finalObj);
  }
};

// * Stream Consumer
async function eventConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "newNotif", fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const rawObj = message.value.toString();
      const parseObj = JSON.parse(rawObj);
      newNotifProcess(parseObj);
    },
  });
}

module.exports = eventConsumer;
