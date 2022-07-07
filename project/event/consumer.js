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

// * Processor / Job
const newUserProcess = async (message) => {
  log.info("incoming data 📩:", message);
  // * business logic
  let userObj = _.omit(message, "topic");
  const user = await User.findOne({ where: { id: userObj.id } });
  if (!user) {
    await User.create(userObj);
  }
};

const newCommentProcess = async (message) => {
  log.info("incoming data 📩:", message);

  // * business logic
  let finalObj = _.omit(message, "topic", "totalComment");
  const comment = await Comment.findOne({ where: { id: finalObj.id } });
  if (!comment) {
    await Comment.create(finalObj);
  }

  await Card.update(
    { comment: message.totalComment },
    { where: { id: finalObj.cardId } }
  );
};

const deleteCommentProcess = async (message) => {
  log.info("incoming data 📩:", message);
  // * business logic
  await Comment.destroy({ where: { id: message.id } });
  await Card.update(
    { comment: message.totalComment },
    { where: { id: message.cardId } }
  );
};

// * Topic Consumer
async function eventConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topics: ["newUser", "newComment", "deleteComment"],
    fromBeginning: true,
  });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const rawObj = message.value.toString();
      const parseObj = JSON.parse(rawObj);
      if (topic == "newUser") {
        newUserProcess(parseObj);
      }
      if (topic == "newComment") {
        newCommentProcess(parseObj);
      }
      if (topic == "deleteComment") {
        deleteCommentProcess(parseObj);
      }
    },
  });
}

module.exports = eventConsumer;
