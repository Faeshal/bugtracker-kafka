"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      user.hasMany(models.project, { foreignKey: "creatorId" });
      user.belongsToMany(models.project, { through: models.user_project });
      user.hasMany(models.card, { onDelete: "cascade", hooks: true });
      user.hasMany(models.comment, { onDelete: "cascade", hooks: true });
    }
  }
  user.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      username: DataTypes.STRING,
      email: DataTypes.STRING,
      title: DataTypes.STRING,
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "user",
    }
  );
  return user;
};
