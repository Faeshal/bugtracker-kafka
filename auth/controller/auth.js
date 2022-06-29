require("pretty-error").start();
require("dotenv").config();
const asyncHandler = require("express-async-handler");
const { Op } = require("sequelize");
const User = require("../models").user;
const _ = require("underscore");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { ErrorResponse } = require("../middleware/errorHandler");
const {
  generateAccessToken,
  generateRefreshsToken,
  verifyRefreshToken,
} = require("../middleware/auth");
const publish = require("../event/publisher");
const log = require("log4js").getLogger("auth");
log.level = "info";

// * @route   POST /api/v1/auth/register
// @desc      Signup new user
// @access    Public
exports.register = asyncHandler(async (req, res, next) => {
  const { email, password, username, role, title } = req.body;

  // *Express Validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ErrorResponse(errors.array({ onlyFirstError: true })[0].msg, 400)
    );
  }

  // * check double email
  const emailExist = await User.findOne({ where: { email } });
  if (emailExist) {
    return next(new ErrorResponse("email already exist", 400));
  }

  // * Hash Password
  const hashedPw = await bcrypt.hash(password, 12);

  // * save user
  const user = new User({
    username,
    email,
    password: hashedPw,
    role,
    title,
  });
  const result = await user.save();

  // * define payload
  let payload = {
    id: result.id,
    username: result.username,
    email: result.email,
    role: result.role,
  };

  // * generate Access token
  const accessToken = await generateAccessToken(payload);

  // * Generate Refresh Token
  const refreshToken = await generateRefreshsToken(payload);

  // * Publish Event
  publish({
    topic: "newUser",
    id: result.id,
    username,
    email,
    title,
    status: result.status,
  });

  // publish({
  //   stream: "newNotif",
  //   fromUserId: result.id,
  //   targetUserId: result.id,
  //   type: "welcome aboard",
  //   content: `hello ${username} 👋, welcome to BugTracker 😎`,
  //   createdAt: new Date().toLocaleDateString(),
  // });

  res.status(200).cookie("token", accessToken).json({
    success: true,
    data: { username, email, accessToken, refreshToken },
  });
});

// * @route   POST /api/v1/auth/login
// @desc      login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // *Express Validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ErrorResponse(errors.array({ onlyFirstError: true })[0].msg, 400)
    );
  }

  // * Check is email exist ?
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "User / Password Doesn't Match or Exist",
    });
  }

  // * Compare Password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: "User / Password Doesn't Match or Exist",
    });
  }

  // * Send Back Data Without Sensitive Information
  const data = await User.findOne({
    where: { email },
  });

  // * define payload
  let payload = {
    id: data.id,
    username: data.username,
    email: data.email,
    role: data.role,
  };

  // * generate Access token
  const accessToken = await generateAccessToken(payload);

  // * Generate Refresh Token
  const refreshToken = await generateRefreshsToken(payload);

  res
    .status(200)
    .cookie("token", accessToken)
    .json({
      success: true,
      data: { id: data.id, username: data.username, accessToken, refreshToken },
    });
});

// * @route   POST /api/v1/auth/refresh
// @desc      refresh jwt token
// @access    Public
exports.refresh = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  // *Express Validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ErrorResponse(errors.array({ onlyFirstError: true })[0].msg, 400)
    );
  }

  // * Verify Refresh Token
  const verifyResult = await verifyRefreshToken(refreshToken);

  // * remove iat & exp value
  const payload = _.pick(verifyResult, "id", "email", "role");

  // * Buat Baru Access Token & Refresh Token
  const accessToken = await generateAccessToken(payload);
  const refToken = await generateRefreshsToken(payload);

  // * Send Refresh Token & Dan Access token
  res.status(200).json({ success: true, accessToken, refreshToken: refToken });
});

// * @route GET /api/v1/auth/profiles
// @desc    Get User Detail
// @access  Private [admin,user]
exports.getAccount = asyncHandler(async (req, res, next) => {
  const { id } = req.user;
  log.warn("user nih:", req.user);
  const data = await User.findOne({
    where: { id },
    attributes: { exclude: "password" },
  });
  res.status(200).json({
    success: true,
    data,
  });
});

// * @route GET /api/v1/auth/logout
// @desc    logout
// @access  Private [admin,user]
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// * @route GET /api/v1/auth/users
// @desc    get all users
// @access  Private [admin]
exports.getUsers = asyncHandler(async (req, res, next) => {
  const { endCursor, startCursor, search } = req.query;
  let filter = {};

  if (search) {
    let searchOption = {
      [Op.or]: [{ username: { [Op.like]: `%${search}%` } }],
    };
    filter = _.extend(searchOption, filter);
  }

  // * Main Query
  let queryObj = {
    where: filter,
    attributes: { exclude: ["createdAt", "updatedAt", "password"] },
    limit: 5,
    after: endCursor,
    order: [["id", "DESC"]],
    raw: true,
  };
  if (startCursor) {
    _.omit(queryObj, "after");
    _.extend(queryObj, { before: startCursor });
  }

  let data = await User.paginate(queryObj);
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
    data: fmtData || [],
  });
});

// * @route GET /api/v1/auth/users
// @desc    get all users
// @access  Private [admin]
exports.getUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const data = await User.findOne({
    where: { id },
    attributes: { exclude: ["password"] },
  });
  res.status(200).json({
    success: true,
    data: data || {},
  });
});
