require("pretty-error").start();
const Notif = require("../models/Notif");
const asyncHandler = require("express-async-handler");
const log = require("log4js").getLogger("notif");
const _ = require("underscore");
log.level = "info";

// * @route GET /api/v1/notifications
// @desc    get notifications by current userId
// @access  Private[admin,user]
exports.getNotifByUserId = asyncHandler(async (req, res, next) => {
  const { id } = req.user;
  const { page } = req.query;
  const options = {
    page: page || 1,
    limit: 20,
    sort: { _id: -1 },
  };
  const myAggregate = Notif.aggregate([
    {
      $match: { targetUserId: id },
    },
    { $project: { fromUserId: 0, targetUserId: 0 } },
  ]);
  const data = await Notif.aggregatePaginate(myAggregate, options);
  res.status(200).json({
    success: true,
    totalDocs: data.totalDocs,
    limit: data.limit,
    page: data.page,
    totalPages: data.totalPages,
    pagingCounter: data.pagingCounter,
    hasPrevPage: data.hasPrevPage,
    hasNextPage: data.hasNextPage,
    prevPage: data.prevPage,
    nextPage: data.nextPage,
    data: data.docs,
  });
});
