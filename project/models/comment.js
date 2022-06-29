"use strict";
const { Model } = require("sequelize");
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
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      content: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "comment",
    }
  );

  return comment;
};
