const express = require("express");
const router = express.Router();
const projectController = require("../controller/project");
const { protect, AuthorizeRole } = require("../middleware/auth");
const { body } = require("express-validator");

router.get("/api/v1/projects", protect, projectController.getProjects);
router.post(
  "/api/v1/projects",
  protect,
  AuthorizeRole("user"),
  [
    body("title", "title is required & maximum 20 char")
      .not()
      .isEmpty()
      .isLength({ max: 20 })
      .trim(),
    body("description", "description is required").not().isEmpty().trim(),
    body("members", "members is required & must be an array of integer")
      .isArray()
      .isNumeric(),
  ],
  projectController.createProject
);
router.get("/api/v1/projects/:id", protect, projectController.getProject);
router.put(
  "/api/v1/projects/:id",
  protect,
  AuthorizeRole("user"),
  [
    body("title", "title is required & maximum 20 char")
      .optional()
      .isLength({ min: 1, max: 20 })
      .trim(),
    body("description", "description is required").optional().trim(),
  ],
  projectController.updateProject
);
router.delete(
  "/api/v1/projects/:id",
  protect,
  AuthorizeRole("user"),
  projectController.deleteProject
);

module.exports = router;
