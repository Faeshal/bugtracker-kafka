"use strict";
const express = require("express");
const app = express();
const PORT = process.env.PORT || 4000;
const morgan = require("morgan");
const helmet = require("helmet");
const notifRoutes = require("./route/notif");
const { errorHandler } = require("./middleware/errorHandler");
const mongoConn = require("../notif/util/mongoConn");
const eventConsumer = require("./event/consumer");
const log = require("log4js").getLogger("entrypoint");
log.level = "info";

// * Security
app.use(helmet());

// * logger
app.use(morgan("tiny"));

// * Body Parser
app.use(express.json());

//  * Routing
app.use(notifRoutes);

app.get("/", (res) => {
  res.json({ success: true, message: "Notif Service UP!" });
});

// * Custom Error Handler
app.use(errorHandler);

// * DB Conn
mongoConn();

//  * SERVER LISTEN
app.listen(PORT, () => {
  log.info(`Notif service is running on port ${PORT}`);
});

// * consumer
eventConsumer();
