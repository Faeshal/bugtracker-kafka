require("pretty-error").start();
const asyncHandler = require("express-async-handler");
const Card = require("../models").card;
const Comment = require("../models").comment;
const User = require("../models").user;
const _ = require("underscore");
const { validationResult } = require("express-validator");
const { ErrorResponse } = require("../middleware/errorHandler");
const publish = require("../event/publisher");
const log = require("log4js").getLogger("comment");
log.level = "info";

// * @route POST /api/v1/comments
// @desc    create new comments
// @access  Private[user]
exports.createComment = asyncHandler(async (req, res, next) => {
  let { content, cardId } = req.body;
  const { id, username } = req.user;

  // *Express Validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ErrorResponse(errors.array({ onlyFirstError: true })[0].msg, 400)
    );
  }

  // * check valid cardId
  const card = await Card.findOne({ where: { id: cardId } });
  if (!card) {
    return next(new ErrorResponse("invalid cardId", 400));
  }
  let { comment } = card;
  let totalComment = ++comment;

  // * save to comment
  const result = await Comment.create({ cardId, content, userId: id });

  // * update counting comment in card
  await Card.update({ comment: totalComment }, { where: { id: cardId } });

  // * publish event
  publish({
    stream: "newComment",
    id: result.id,
    userId: id,
    cardId: parseInt(cardId),
    content,
    totalComment,
  });

  // all people that "involved" in the card, get notif
  let users = await Comment.findAll({ where: { cardId: parseInt(cardId) } });
  let userIds = [];
  for (user of users) {
    userIds.push(user.userId);
  }
  userIds = _.uniq(userIds);

  for (userId of userIds) {
    publish({
      stream: "newNotif",
      fromUserId: id,
      targetUserId: userId,
      type: "new comment",
      content: `📢 ${username} comment in card ${card.name}`,
      createdAt: new Date().toLocaleDateString(),
    });
  }

  res.status(201).json({
    success: true,
    message: "comment created",
  });
});

// * @route GET /api/v1/comments/cards/:id
// @desc    get comment by card id
// @access  Private[user]
exports.getCommentByCardId = asyncHandler(async (req, res, next) => {
  const { startCursor, endCursor, limit } = req.query;
  let { id } = req.params;

  // * Main Query
  let queryObj = {
    where: { cardId: id },
    limit: parseInt(limit) || 20,
    after: endCursor,
    order: [["id", "DESC"]],
    include: { model: User, attributes: ["username"] },
  };
  if (startCursor) {
    _.omit(queryObj, "after");
    _.extend(queryObj, { before: startCursor });
  }

  let data = await Comment.paginate(queryObj);
  const dataArr = data.edges;

  // * Formating Data
  let fmtData = _.map(dataArr, (obj) => {
    const finalData = _.extend(obj.node, { cursor: obj.cursor });
    return finalData;
  });

  // * grab card info
  const card = await Card.findOne({
    where: { id },
    attributes: ["name"],
  });

  res.status(200).json({
    success: true,
    totalData: data.totalCount,
    limitPerPage: parseInt(limit),
    nextPage: data.pageInfo.hasNextPage,
    previousPage: data.pageInfo.hasPreviousPage,
    startCursor: data.pageInfo.startCursor,
    endCursor: data.pageInfo.endCursor,
    card: card.name,
    data: fmtData || [],
  });
});

// * @route DELETE /api/v1/comments/:id
// @desc    delete comment by id
// @access  Private[user]
exports.deleteComment = asyncHandler(async (req, res, next) => {
  let { id } = req.params;
  const userId = req.user.id;

  // * check valid comment
  const comment = await Comment.findOne({
    where: { id },
    include: [{ model: Card, attributes: ["comment"] }],
  });
  if (!comment) {
    return next(new ErrorResponse("invalid commentId", 400));
  }

  // * Security check
  if (comment.userId !== userId) {
    return next(new ErrorResponse("forbidden", 403));
  }

  // * delete comment
  await Comment.destroy({ where: { id } });

  // * update counting comment in card
  let currentComment = comment.card.comment;
  let totalComment = --currentComment;
  await Card.update(
    { comment: totalComment },
    { where: { id: comment.cardId } }
  );

  // * publish comment
  publish({
    stream: "deleteComment",
    id: parseInt(id),
    cardId: comment.cardId,
    totalComment,
  });

  res.status(200).json({
    success: true,
    message: "succesfully delete",
  });
});

// * @route GET /api/v1/comments/cards/:id
// @desc    get detail comment by card id
// @access  Private[user]
exports.getComment = asyncHandler(async (req, res, next) => {
  let { id } = req.params;
  const data = await Comment.findOne({
    where: { id },
    include: [
      {
        model: Card,
        attributes: {
          exclude: ["id", "cardId", "userId", "projectId", "updatedAt"],
        },
      },
      { model: User, attributes: ["username", "title"] },
    ],
    attributes: { exclude: ["updatedAt"] },
  });
  res.status(200).json({
    success: true,
    data: data || {},
  });
});
