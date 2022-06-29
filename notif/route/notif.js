const express = require("express");
const router = express.Router();
const notifController = require("../controller/notif");
const { protect, AuthorizeRole } = require("../middleware/auth");

router.get(
  "/api/v1/notifications",
  protect,
  AuthorizeRole("user"),
  notifController.getNotifByUserId
);

module.exports = router;
