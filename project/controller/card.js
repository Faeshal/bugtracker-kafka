require("pretty-error").start();
const asyncHandler = require("express-async-handler");
const User = require("../models").user;
const Card = require("../models").card;
const Project = require("../models").project;
const User_Project = require("../models").user_project;
const _ = require("underscore");
const { validationResult } = require("express-validator");
const { ErrorResponse } = require("../middleware/errorHandler");
const publish = require("../event/publisher");
const log = require("log4js").getLogger("card");
log.level = "info";

// * @route POST /api/v1/projects/cards
// @desc    create new card
// @access  Private[user]
exports.createCard = asyncHandler(async (req, res, next) => {
  var { name, content, projectId } = req.body;
  const { id, username } = req.user;

  // *Express Validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ErrorResponse(errors.array({ onlyFirstError: true })[0].msg, 400)
    );
  }

  // * check valid projectId
  const project = await Project.findOne({ where: { id: parseInt(projectId) } });
  if (!project) {
    return next(new ErrorResponse("invalid preojectId", 400));
  }

  // * save to card
  const result = await Card.create({ name, content, projectId, userId: id });

  // * publish event
  publish({
    stream: "newCard",
    id: result.id,
    name,
    content,
    projectId,
    userId: id,
  });

  const members = await User_Project.findAll({
    where: { projectId: parseInt(projectId) },
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
      type: "new card",
      content: `📋 ${username} add card ${name} to project ${project.title}`,
      createdAt: new Date().toLocaleDateString(),
    });
  }

  res.status(201).json({
    success: true,
    data: result,
  });
});

// * @route GET /api/v1/projects/:id/cards
// @desc    get card by projectId
// @access  Private
exports.getCardProject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  let { status, startCursor, endCursor } = req.query;

  // * check valid projectId
  const project = await Project.findOne({
    where: { id },
    attibutes: ["title"],
  });
  if (!project) {
    return next(new ErrorResponse("invalid preojectId", 400));
  }

  let filter = { projectId: id };
  if (status) {
    status = JSON.parse(status.toLowerCase());
    filter.status = status;
  }

  // * Main Query
  let queryObj = {
    where: filter,
    limit: req.query.limit,
    after: endCursor,
    order: [["id", "DESC"]],
    include: [{ model: User, attributes: ["username", "email"] }],
  };
  if (startCursor) {
    _.omit(queryObj, "after");
    _.extend(queryObj, { before: startCursor });
  }

  let data = await Card.paginate(queryObj);
  const dataArr = data.edges;

  // * Formating Data
  let fmtData = _.map(dataArr, (obj) => {
    const finalData = _.extend(obj.node, { cursor: obj.cursor });
    return finalData;
  });

  res.status(200).json({
    success: true,
    totalData: data.totalCount,
    limitPerPage: req.query.limit,
    nextPage: data.pageInfo.hasNextPage,
    previousPage: data.pageInfo.hasPreviousPage,
    startCursor: data.pageInfo.startCursor,
    endCursor: data.pageInfo.endCursor,
    project: project.title,
    data: fmtData || [],
  });
});

// * @route GET /api/v1/projects/cards/:id
// @desc    get card by id
// @access  Private
exports.getCard = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const data = await Card.findOne({
    where: { id },
    include: [
      {
        model: User,
        attributes: { exclude: ["id", "createdAt", "updatedAt"] },
      },
      { model: Project, attributes: ["title", "description"] },
    ],
  });
  res.status(200).json({
    success: true,
    data: data || {},
  });
});

// * @route PUT /api/v1/projects/cards/:id
// @desc    get card by id
// @access  Private
exports.updateCard = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { name, content } = req.body;

  // *Express Validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ErrorResponse(errors.array({ onlyFirstError: true })[0].msg, 400)
    );
  }

  // * check is creator project ?
  const isCreator = await Card.findOne({ where: { id, userId } });
  if (!isCreator) {
    return next(new ErrorResponse("forbidden", 400));
  }

  // * update
  await Card.update({ name, content }, { where: { id } });

  // * publish event
  publish({
    queueName: "updateCard",
    id,
    name,
    content,
  });

  res.status(200).json({
    success: true,
    message: "succesfully update",
  });
});

// * @route DELETE /api/v1/projects/cards/:id
// @desc    delete card
// @access  Private
exports.deleteCard = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  // * check is creator project ?
  const isCreator = await Card.findOne({ where: { id, userId } });
  if (!isCreator) {
    return next(new ErrorResponse("forbidden", 400));
  }

  // * delete project
  await Card.destroy({ where: { id } });

  // * publish event
  publisher({
    queueName: "deleteCard",
    id,
  });

  res.status(200).json({
    success: true,
    message: "successfully delete",
  });
});

// * @route PATCH /api/v1/projects/cards/:id
// @desc    change card status
// @access  Private[user]
exports.changeCardStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  const { username } = req.user;
  const currentUserId = req.user.id;

  // *Express Validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ErrorResponse(errors.array({ onlyFirstError: true })[0].msg, 400)
    );
  }

  // * check valid cardId
  const card = await Card.findOne({ where: { id: parseInt(id) } });
  if (!card) {
    return next(new ErrorResponse("invalid cardId", 400));
  }

  // * check valid creator
  if (card.userId !== id) {
    return next(new ErrorResponse("forbidden", 403));
  }

  // * update card status
  const result = await Card.uppdate(
    { status },
    { wherer: { id: parseInt(id) } }
  );

  // * publish event
  publish({
    stream: "changeCardStatus",
    id: parseInt(id),
    status,
    userId: currentUserId,
  });

  const members = await User_Project.findAll({
    where: { projectId: parseInt(card.projectId) },
  });
  let userIds = [];
  for (member of members) {
    userIds.push(member.userId);
  }

  for (userId of userIds) {
    publish({
      stream: "newNotif",
      fromUserId: currentUserId,
      targetUserId: userId,
      type: "new card",
      content: `📋 ${username} change status of card ${card.name} to ${status}`,
      createdAt: new Date().toLocaleDateString(),
    });
  }

  res.status(201).json({
    success: true,
    data: result,
  });
});
