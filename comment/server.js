"use strict";
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const morgan = require("morgan");
const helmet = require("helmet");
const commentRoutes = require("./route/comment");
const { errorHandler } = require("./middleware/errorHandler");
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
app.use(commentRoutes);

app.get("/", (res) => {
  res.json({ success: true, message: "Comment Service UP!" });
});

// * Custom Error Handler
app.use(errorHandler);

//  * SERVER LISTEN
app.listen(PORT, () => {
  log.info(`Comment service is running on port ${PORT}`);
});

// * Event Consumer
eventConsumer();
