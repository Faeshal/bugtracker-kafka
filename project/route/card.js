const express = require("express");
const router = express.Router();
const cardController = require("../controller/card");
const { protect, AuthorizeRole } = require("../middleware/auth");
const { body } = require("express-validator");

router.post(
  "/api/v1/projects/cards",
  protect,
  AuthorizeRole("user"),
  [
    body("name", "name is required & maximum 30 char")
      .not()
      .isEmpty()
      .isLength({ max: 30 })
      .trim(),
    body("content", "content is required").not().isEmpty().trim(),
    body("projectId", "projectId is required & must be an integer")
      .not()
      .isEmpty()
      .isNumeric(),
  ],
  cardController.createCard
);

router.get(
  "/api/v1/projects/:id/cards",
  protect,
  cardController.getCardProject
);

router.get("/api/v1/projects/cards/:id", protect, cardController.getCard);

router.put(
  "/api/v1/projects/cards/:id",
  protect,
  [
    body("name", "name maximum 50 char")
      .optional()
      .isLength({ max: 50 })
      .trim(),
    body("content").optional().trim(),
  ],
  cardController.updateCard
);

router.delete(
  "/api/v1/projects/cards/:id",
  protect,
  AuthorizeRole("user"),
  cardController.deleteCard
);

router.patch(
  "/api/v1/projects/cards/:id",
  protect,
  AuthorizeRole("user"),
  [
    body("status", "status is required & must be boolean")
      .not()
      .isEmpty()
      .isBoolean(),
  ],
  cardController.changeCardStatus
);
module.exports = router;
