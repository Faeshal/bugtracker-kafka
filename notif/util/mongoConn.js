require("dotenv").config();
const mongoose = require("mongoose");
const log = require("log4js").getLogger("util-mongoConn");
log.level = "info";

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  log.info("MongoDB UP 🍀 ", conn.connection.host);
};

module.exports = connectDB;
