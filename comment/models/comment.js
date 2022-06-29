"use strict";
const { Model } = require("sequelize");
const withPagination = require("sequelize-cursor-pagination");
module.exports = (sequelize, DataTypes) => {
  class comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      comment.belongsTo(models.card, { onDelete: "cascade", hooks: true });
      comment.belongsTo(models.user, { onDelete: "cascade", hooks: true });
    }
  }
  comment.init(
    {
      content: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "comment",
    }
  );

  const options = {
    methodName: "paginate",
    primaryKeyField: "id",
  };
  withPagination(options)(comment);

  return comment;
};
