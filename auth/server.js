"use strict";
require("dotenv").config();
require("pretty-error").start();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 1000;
const morgan = require("morgan");
const cors = require("cors");
const authRoutes = require("./route/auth");
const compression = require("compression");
const hpp = require("hpp");
const helmet = require("helmet");
const log4js = require("log4js");
const dayjs = require("dayjs");
const { errorHandler } = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");
const log = log4js.getLogger("entrypoint");
log.level = "info";

// * Security Headers, Logger, Parser & Compression
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(hpp());

// * Cookie Parser
app.use(
  cookieParser({
    expires: new Date(Date.now() + 600000), // 10 minute
    httpOnly: true,
  })
);

// * Http Logger
morgan.token("time", (req) => {
  let user = "anonym";
  if (req.session) {
    if (req.session.name) {
      user = req.session.name || "anonym";
    }
  }
  const time = dayjs().format("h:mm:ss A") + " - " + user;
  return time;
});

app.use(morgan("morgan: [:time] :method :url - :status"));

// * Session & Persistent Store

// * Paginate
// app.use(paginate.middleware(20, 50));

// * Routing
app.use(authRoutes);

app.get("/", (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Bug Tracker - Auth Service",
  });
});

app.get("*", function (req, res) {
  res.status(404).json({ success: false, message: "Nothing In this Route..." });
});

// * Custom Error Handler
app.use(errorHandler);

// * Server Listen
app.listen(PORT, (err) => {
  if (err) {
    log.error(`Error : ${err}`);
    process.exit(1);
  }
  log.info(`Auth Service UP : ${PORT} ⚡`);
});

module.exports = app;
