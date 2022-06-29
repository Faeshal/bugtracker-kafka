require("pretty-error").start();
const Notif = require("../models/Notif");
const _ = require("underscore");
const log = require("log4js").getLogger("event-consumer");
log.level = "info";
const Redis = require("ioredis");
const redis = new Redis();

// * Processor / Job
const newNotifProcess = async (message) => {
  const key = message[0];
  const rawArr = message[1];
  const rawObj = JSON.parse(rawArr[1]);
  log.info("incoming data 📩:", rawObj);

  // * Set cache Last Stream Id
  const setId = await redis.set("id_newnotif_notifservice", key);
  log.info("set cache userId 💾:", setId);

  // * business logic
  let finalObj = _.omit(rawObj, "stream");
  const notif = await Notif.findOne(finalObj);
  if (!notif) {
    await Notif.create(finalObj);
  }
};

// * Stream Consumer
async function eventConsumer() {
  // * notif stream
  let newNotifId;
  const cacheNewNotifId = await redis.get("id_newnotif_notifservice");
  if (cacheNewNotifId == null) {
    newNotifId = "0";
  } else {
    newNotifId = cacheNewNotifId;
  }
  log.info("newNotif lastId:", newNotifId);

  // * Listen Stream
  const result = await redis.xread(
    "block",
    0,
    "STREAMS",
    "newNotif",
    newNotifId
  );
  const [key, messages] = result[0];
  messages.forEach(newNotifProcess);

  // Pass the last id of the results to the next round.
  await eventConsumer(messages[messages.length - 1][0]);
}

module.exports = eventConsumer;
