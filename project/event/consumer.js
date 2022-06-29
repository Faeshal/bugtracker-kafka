require("pretty-error").start();
const { Kafka } = require("kafkajs");
const User = require("../models").user;
const Card = require("../models").card;
const Comment = require("../models").comment;
const _ = require("underscore");
const log = require("log4js").getLogger("consumer");
log.level = "info";

// * Kafka Cred
const kafka = new Kafka({
  clientId: "project",
  brokers: ["127.0.0.1:9092"],
});

const consumer = kafka.consumer({ groupId: "project" });

// * Stream Consumer
async function eventConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "newUser", fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      log.info({
        value: message.value.toString(),
      });
    },
  });
}

module.exports = eventConsumer;
