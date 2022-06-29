"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      project.hasMany(models.card, { onDelete: "cascade", hooks: true });
      project.belongsTo(models.user, { foreignKey: "creatorId" });
      project.belongsToMany(models.user, { through: models.user_project });
    }
  }
  project.init(
    {
      title: DataTypes.STRING,
      description: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "project",
    }
  );
  return project;
};
