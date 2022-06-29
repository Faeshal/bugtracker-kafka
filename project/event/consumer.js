require("pretty-error").start();
const User = require("../models").user;
const Card = require("../models").card;
const Comment = require("../models").comment;
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
  const setId = await redis.set("id_newuser_projectservice", key);
  log.info("set cache userId 💾:", setId);

  // * business logic
  let finalObj = _.omit(rawObj, "stream");
  const user = await User.findOne({ where: { id: finalObj.id } });
  if (!user) {
    await User.create(finalObj);
  }
};

const newCommentProcess = async (message) => {
  const key = message[0];
  const rawArr = message[1];
  const rawObj = JSON.parse(rawArr[1]);
  log.info("incoming data 📩:", rawObj);

  // * Set cache Last Stream Id
  const setId = await redis.set("id_newcomment_projectservice", key);
  log.info("set cache newComment 💾:", setId);

  // * business logic
  let finalObj = _.omit(rawObj, "stream", "totalComment");
  const comment = await Comment.findOne({ where: { id: finalObj.id } });
  if (!comment) {
    await Comment.create(finalObj);
  }

  await Card.update(
    { comment: rawObj.totalComment },
    { where: { id: finalObj.cardId } }
  );
};

const deleteCommentProcess = async (message) => {
  const key = message[0];
  const rawArr = message[1];
  const rawObj = JSON.parse(rawArr[1]);
  log.info("incoming data 📩:", rawObj);

  // * Set cache Last Stream Id
  const setId = await redis.set("id_deletecomment_projectservice", key);
  log.info("set cache deleteComment 💾:", setId);

  // * business logic
  await Comment.destroy({ where: { id: rawObj.id } });
  await Card.update(
    { comment: rawObj.totalComment },
    { where: { id: rawObj.cardId } }
  );
};

// * Stream Consumer
async function eventConsumer() {
  // * newUser stream
  let newUserId;
  const cacheNewUserId = await redis.get("id_newuser_projectservice");
  if (cacheNewUserId == null) {
    newUserId = "0";
  } else {
    newUserId = cacheNewUserId;
  }
  log.info("newUser lastId:", newUserId);

  // * newComment stream
  let newCommentId;
  const cacheCommentId = await redis.get("id_newcomment_projectservice");
  if (cacheCommentId == null) {
    newCommentId = "0";
  } else {
    newCommentId = cacheCommentId;
  }
  log.info("newComment lastId:", newCommentId);

  // * deleteComment stream
  let delCommentId;
  const cacheDelCommentId = await redis.get("id_deletecomment_projectservice");
  if (cacheDelCommentId == null) {
    delCommentId = "0";
  } else {
    delCommentId = cacheDelCommentId;
  }
  log.info("deleteComment lastId:", delCommentId);

  // * Listen Stream
  const result = await redis.xread(
    "block",
    0,
    "STREAMS",
    "newUser",
    "newComment",
    "deleteComment",
    newUserId,
    newCommentId,
    delCommentId
  );

  const [key, messages] = result[0]; // key = nama streamnya

  if (key == "newUser") {
    messages.forEach(newUserProcess);
  }

  if (key == "newComment") {
    messages.forEach(newCommentProcess);
  }

  if (key == "deleteComment") {
    messages.forEach(deleteCommentProcess);
  }

  // Pass the last id of the results to the next round.
  await eventConsumer(messages[messages.length - 1][0]);
}

module.exports = eventConsumer;
