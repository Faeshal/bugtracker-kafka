require("pretty-error").start();
const { Kafka } = require("kafkajs");
const User = require("../models").user;
const Project = require("../models").project;
const Card = require("../models").card;
const _ = require("underscore");
const log = require("log4js").getLogger("consumer");
log.level = "info";

// * Kafka Cred
const kafka = new Kafka({
  clientId: "comment",
  brokers: ["127.0.0.1:9092"],
});
const consumer = kafka.consumer({ groupId: "comment" });

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

const newProjectProcess = async (message) => {
  log.info("incoming data 📩:", message);
  // * business logic
  let finalObj = _.omit(message, "topic");
  const project = await Project.findOne({ where: { id: finalObj.id } });
  if (!project) {
    await Project.create(finalObj);
  }
};

const updateProjectProcess = async (message) => {
  log.info("incoming data 📩:", message);
  // * business logic
  const project = await Project.findOne({
    where: { id: parseInt(message.id) },
  });
  if (project) {
    await Project.update(
      { title: message.title, description: message.description },
      { where: { id: parseInt(message.id) } }
    );
  }
};

const deleteProjectProcess = async (message) => {
  log.info("incoming data📩:", message);
  // * business logic
  const project = await Project.findOne({
    where: { id: parseInt(message.id) },
  });
  if (project) {
    await Project.destroy({ where: { id: parseInt(message.id) } });
  }
};

const newCardProcess = async (message) => {
  log.info("incoming data 📩:", message);
  // * business logic
  let finalObj = _.omit(message, "topic");
  const card = await Card.findOne({ where: { id: finalObj.id } });
  if (!card) {
    await Card.create(finalObj);
  }
};

const updateCardProcess = async (message) => {
  log.info("incoming data 📩:", message);
  // * business logic
  const card = await Card.findOne({ where: { id: parseInt(message.id) } });
  if (card) {
    await Card.update(
      { name: message.name, content: message.content },
      { where: { id: parseInt(message.id) } }
    );
  }
};

const changeCardStatusProcess = async (message) => {
  log.info("incoming data 📩:", message);
  // * business logic
  let finalObj = _.omit(message, "topic");
  const card = await Card.findOne({ where: { id: finalObj.id } });
  if (card) {
    await Card.update(
      { status: finalObj.status },
      { where: { id: finalObj.id } }
    );
  }
};

const deleteCardProcess = async (message) => {
  log.info("incoming data 📩:", message);
  // * business logic
  await Card.destroy({ where: { id: parseInt(message.id) } });
};

// * Stream Consumer
async function eventConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topics: [
      "newUser",
      "newProject",
      "updateProject",
      "deleteProject",
      "newCard",
      "updateCard",
      "changeCardStatus",
      "deleteCard",
    ],
    fromBeginning: true,
  });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const rawObj = message.value.toString();
      const parseObj = JSON.parse(rawObj);
      if (topic == "newUser") {
        newUserProcess(parseObj);
      }
      if (topic == "newProject") {
        newProjectProcess(parseObj);
      }
      if (topic == "updateProject") {
        updateProjectProcess(parseObj);
      }
      if (topic == "deleteProject") {
        deleteProjectProcess(parseObj);
      }
      if (topic == "newCard") {
        newCardProcess(parseObj);
      }
      if (topic == "updateCard") {
        updateCardProcess(parseObj);
      }
      if (topic == "changeCardStatus") {
        changeCardStatusProcess(parseObj);
      }
      if (topic == "deleteCard") {
        deleteCardProcess(parseObj);
      }
    },
  });
}

module.exports = eventConsumer;
