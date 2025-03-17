const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Metrics = sequelize.define(
  "metrics",
  {
    metric_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      autoIncrement: true,
    },
    punch_code: {
      type: DataTypes.STRING(11),
      allowNull: false,
    },
    month_year: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },
    network_hours: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        isValidJSON(value) {
          if (!value || !Array.isArray(value)) {
            throw new Error("Invalid JSON format for network_hours");
          }
        },
      },
    },
    overtime_hours: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        isValidJSON(value) {
          if (!value || !Array.isArray(value)) {
            throw new Error("Invalid JSON format for overtime_hours");
          }
        },
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
  },
  {
    tableName: "metrics",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Metrics;
