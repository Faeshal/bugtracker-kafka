const express = require("express");
const router = express.Router();
const authController = require("../controller/auth");
const { protect } = require("../middleware/auth");
const { body } = require("express-validator");

router.post(
  "/api/v1/auth/register",
  [
    body("email", "email is required & must be valid email")
      .not()
      .isEmpty()
      .isEmail(),
    body("username", "username is Required").not().isEmpty().trim(),
    body("title", "title is Required").not().isEmpty().trim(),
    body("role", "role must be between: user or admin")
      .optional()
      .isIn(["user", "admin"]),
    body("password", "Password lenghth minimum is 5")
      .trim()
      .isLength({ min: 5 }),
  ],
  authController.register
);

router.post(
  "/api/v1/auth/login",
  [
    body("email", "email is required & must be valid email")
      .not()
      .isEmpty()
      .isEmail(),
    body("password", "Password lenghth minimum is 5")
      .trim()
      .isLength({ min: 5 }),
  ],
  authController.login
);

router.post(
  "/api/v1/auth/refresh",
  [body("refreshToken", "refreshToken is required").not().isEmpty().trim()],
  authController.refresh
);

router.get("/api/v1/auth/profiles", protect, authController.getAccount);

router.get("/api/v1/auth/logout", protect, authController.logout);

router.get("/api/v1/auth/users", protect, authController.getUsers);

router.get("/api/v1/auth/users/:id", protect, authController.getUser);

module.exports = router;
