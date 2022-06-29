require("pretty-error").start();
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const _ = require("underscore");
const User = require("../models").user;
const Project = require("../models").project;
const User_Project = require("../models").user_project;
const paginate = require("../util/paginate");
const { validationResult } = require("express-validator");
const { ErrorResponse } = require("../middleware/errorHandler");
const publish = require("../event/publisher");
const log = require("log4js").getLogger("project");
log.level = "info";

// * @route GET /api/v1/projects
// @desc    get all projects
// @access  Private
exports.getProjects = asyncHandler(async (req, res, next) => {
  const { search } = req.query;
  const { role, id } = req.user;
  let filter = {};

  if (role == "user") {
    let projetcIds = [];

    // * get all user projectId
    const projects = await User_Project.findAll({ where: { userId: id } });
    for (project of projects) {
      const { projectId } = project;
      projetcIds.push(projectId);
    }

    // * query based on projectId
    filter.id = { [Op.in]: projetcIds };
  }

  if (search) {
    let searchOption = { title: { [Op.like]: `%${search}%` } };
    filter = _.extend(searchOption, filter);
  }
  const data = await Project.findAndCountAll({
    where: filter,
    limit: req.query.limit,
    offset: req.skip,
    order: [["createdAt", "DESC"]],
    include: [{ model: User, attributes: ["id", "username", "email"] }],
    attributes: { exclude: ["updatedAt", "deletedAt"] },
  });

  // * offset based pagination
  const pagin = await paginate({
    length: data.count,
    limit: req.query.limit,
    page: req.query.page,
    req,
  });

  res.status(200).json({
    success: true,
    totalData: data.count,
    totalPage: pagin.totalPage,
    currentPage: pagin.currentPage,
    nextPage: pagin.nextPage,
    data: data.rows || [],
  });
});

// * @route POST /api/v1/projects
// @desc    create new project
// @access  Private
exports.createProject = asyncHandler(async (req, res, next) => {
  var { title, description, members } = req.body;
  const creatorId = req.user.id;
  const { username } = req.user;
  members = _.unique(members);

  // *Express Validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ErrorResponse(errors.array({ onlyFirstError: true })[0].msg, 400)
    );
  }

  // * save to project
  const result = await Project.create({ title, description, creatorId });

  // * save user_project (pivot table)
  const projectId = result.id;
  members.push(creatorId);
  for (member of members) {
    await User_Project.create({ userId: member, projectId });
  }

  // * publish event
  publish({
    stream: "newProject",
    id: result.id,
    title,
    description,
    creatorId,
  });

  for (member of members) {
    publish({
      stream: "newNotif",
      fromUserId: creatorId,
      targetUserId: member,
      type: "new project created",
      content: `🌟 you are join to a new project ${title} created by ${username}`,
      createdAt: new Date().toLocaleDateString(),
    });
  }

  res.status(201).json({
    success: true,
    data: result,
  });
});

// * @route GET /api/v1/projects/:id
// @desc    get detail project
// @access  Private
exports.getProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const result = await Project.findOne({
    where: { id },
    include: [{ model: User, attributes: ["id", "username"] }],
    raw: true,
    nest: true,
  });

  const memberArr = await User_Project.findAll({
    where: { projectId: id },
    include: [{ model: User, attributes: ["id", "username"] }],
    raw: true,
    nest: true,
  });
  log.info("member arr:", memberArr);

  // * formating data

  let memberData = [];
  for (member of memberArr) {
    const { user } = member;
    memberData.push(user);
  }

  // * extend data
  let fmtData = _.extend({ members: memberData }, result);

  res.status(200).json({
    success: true,
    data: fmtData || {},
  });
});

// * @route PUT /api/v1/projects/:id
// @desc    update project
// @access  Private
exports.updateProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { title, description } = req.body;

  // *Express Validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ErrorResponse(errors.array({ onlyFirstError: true })[0].msg, 400)
    );
  }

  // * check is creator project ?
  const isCreator = await Project.findOne({ where: { id, creatorId: userId } });
  if (!isCreator) {
    return next(new ErrorResponse("forbidden", 400));
  }

  // * update
  await Project.update({ title, description }, { where: { id } });

  // * publish event
  publisher({
    queueName: "updateProject",
    id,
    title,
    description,
  });

  res.status(200).json({
    success: true,
    message: "succesfully update",
  });
});

// * @route DELETE /api/v1/projects/:id
// @desc    delete project
// @access  Private
exports.deleteProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { username } = req.user;

  // * check is creator project ?
  const isCreator = await Project.findOne({ where: { id, creatorId: userId } });
  if (!isCreator) {
    return next(new ErrorResponse("forbidden", 400));
  }

  // * delete project
  await Project.destroy({ where: { id } });

  // * publish event
  publish({
    stream: "deleteProject",
    id: parseInt(id),
    title: isCreator.title,
    creatorId: parseInt(userId),
  });

  const members = await User_Project.findAll({
    where: { projectId: parseInt(id) },
  });
  let userIds = [];
  for (member of members) {
    userIds.push(member.userId);
  }

  for (userId of userIds) {
    publish({
      stream: "newNotif",
      fromUserId: id,
      targetUserId: userId,
      type: "project deleted",
      content: `😥 ${username} delete ${isCreator.title} project`,
      createdAt: new Date().toLocaleDateString(),
    });
  }

  res.status(200).json({
    success: true,
    message: "successfully delete",
  });
});
