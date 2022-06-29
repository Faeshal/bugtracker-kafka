require("pretty-error").start();
const User = require("../models").user;
const Project = require("../models").project;
const Card = require("../models").card;
const _ = require("underscore");
const log = require("log4js").getLogger("sub-redis");
log.level = "info";
const Redis = require("ioredis");
const redis = new Redis();

// * Processor / Job
const newUserProcess = async (message) => {
  const key = message[0];
  const rawArr = message[1];
  const rawObj = JSON.parse(rawArr[1]);
  log.info("incoming data 📩:", rawObj);

  // * Set cache Last Stream Id
  const setId = await redis.set("id_newuser_commentservice", key);
  log.info("set cache userId 💾:", setId);

  // * business logic
  let userObj = _.omit(rawObj, "stream");
  const user = await User.findOne({ where: { id: userObj.id } });
  if (!user) {
    await User.create(userObj);
  }
};

const newProjectProcess = async (message) => {
  const key = message[0];
  const rawArr = message[1];
  const rawObj = JSON.parse(rawArr[1]);
  log.info("incoming data 📩:", rawObj);

  // * Set cache Last Stream Id
  const setId = await redis.set("id_newproject_commentservice", key);
  log.info("set cache projectId 💾:", setId);

  // * business logic
  let finalObj = _.omit(rawObj, "stream");
  const project = await Project.findOne({ where: { id: finalObj.id } });
  if (!project) {
    await Project.create(finalObj);
  }
};

const newCardProcess = async (message) => {
  const key = message[0];
  const rawArr = message[1];
  const rawObj = JSON.parse(rawArr[1]);
  log.info("incoming data 📩:", rawObj);

  // * Set cache Last Stream Id
  const setId = await redis.set("id_newcard_commentservice", key);
  log.info("set cache cardId 💾:", setId);

  // * business logic
  let finalObj = _.omit(rawObj, "stream");
  const card = await Card.findOne({ where: { id: finalObj.id } });
  if (!card) {
    await Card.create(finalObj);
  }
};

const updateCardProcess = async (message) => {
  const key = message[0];
  const rawArr = message[1];
  const rawObj = JSON.parse(rawArr[1]);
  log.info("incoming data 📩:", rawObj);

  // * Set cache Last Stream Id
  const setId = await redis.set("id_updatecard_commentservice", key);
  log.info("set cache updateCardId 💾:", setId);

  // * business logic
  const card = await Card.findOne({ where: { id: rawObj.id } });
  if (card) {
    await Card.update(
      { name: rawObj.name, content: rawObj.content },
      { where: { id: rawObj.id } }
    );
  }
};

const changeCardStatusProcess = async (message) => {
  const key = message[0];
  const rawArr = message[1];
  const rawObj = JSON.parse(rawArr[1]);
  log.info("incoming data 📩:", rawObj);

  // * Set cache Last Stream Id
  const setId = await redis.set("id_changecardstatus_commentservice", key);
  log.info("set cache cardId 💾:", setId);

  // * business logic
  let finalObj = _.omit(rawObj, "stream");
  const card = await Card.findOne({ where: { id: finalObj.id } });
  if (card) {
    await Card.update(
      { status: finalObj.status },
      { where: { id: finalObj.id } }
    );
  }
};

// * Stream Consumer
async function eventConsumer() {
  // * newUser stream
  let newUserId;
  const cacheNewUserId = await redis.get("id_newuser_commentservice");
  if (cacheNewUserId == null) {
    newUserId = "0";
  } else {
    newUserId = cacheNewUserId;
  }
  log.info("newUser lastId:", newUserId);

  // * newProject stream
  let newProjectId;
  const cacheNewProjectId = await redis.get("id_newproject_commentservice");
  if (cacheNewProjectId == null) {
    newProjectId = "0";
  } else {
    newProjectId = cacheNewProjectId;
  }
  log.info("newProject lastId:", newProjectId);

  // * newCard stream
  let newCardId;
  const cacheNewCardId = await redis.get("id_newcard_commentservice");
  if (cacheNewCardId == null) {
    newCardId = "0";
  } else {
    newCardId = cacheNewCardId;
  }
  log.info("newCard lastId:", newCardId);

  // * updateCard stream
  let updateCardId;
  const cacheUpdateCardId = await redis.get("id_updatecard_commentservice");
  if (cacheUpdateCardId == null) {
    updateCardId = "0";
  } else {
    updateCardId = cacheUpdateCardId;
  }
  log.info("newUpdateCard lastId:", updateCardId);

  // * changeCardStatus stream
  let changeCardStatusId;
  const cacheChangeCardStatus = await redis.get(
    "id_changecardstatus_commentservice"
  );
  if (cacheChangeCardStatus == null) {
    changeCardStatusId = "0";
  } else {
    changeCardStatusId = cacheChangeCardStatus;
  }
  log.info("newCard lastId:", changeCardStatusId);

  // * Listen Stream
  const result = await redis.xread(
    "block",
    0,
    "STREAMS",
    "newUser",
    "newProject",
    "newCard",
    "updateCard",
    "changeCardStatus",
    newUserId,
    newProjectId,
    newCardId,
    updateCardId,
    changeCardStatusId
  );

  const [key, messages] = result[0]; // key = nama streamnya

  if (key == "newUser") {
    messages.forEach(newUserProcess);
  }

  if (key == "newProject") {
    messages.forEach(newProjectProcess);
  }

  if (key == "newCard") {
    messages.forEach(newCardProcess);
  }

  if (key == "updateCard") {
    messages.forEach(updateCardProcess);
  }

  if (key == "changeCardStatus") {
    messages.forEach(changeCardStatusProcess);
  }

  // Pass the last id of the results to the next round.
  await eventConsumer(messages[messages.length - 1][0]);
}

module.exports = eventConsumer;
