require("dotenv").config();
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const _ = require("underscore");

// * Read PEM
const secret = process.env.JWT_SECRET;

exports.protect = asyncHandler(async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      console.log("Not authorized to access this route");
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    // * Verify Token
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("error:", err);
    return res.status(401).json({
      success: false,
      message: "unauthorized",
    });
  }
});

exports.AuthorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `user role ${req.user.role} is not Authorize to access this route`,
      });
    }
    next();
  };
};

exports.AuthorizeScope = (scope) => {
  return (req, res, next) => {
    const userScope = req.user.scope;
    const userScopeArr = userScope.split(" ");
    const isPass = _.intersection(userScopeArr, scope);
    if (isPass.length == 0) {
      return res.status(403).json({
        success: false,
        message: "not have permission",
      });
    }
    next();
  };
};
