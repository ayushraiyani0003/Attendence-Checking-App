const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Metrics = sequelize.define(
  "metrics",
  {
    metric_id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      autoIncrement: false,
    },
    punch_code: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    month_year: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },
    network_hours: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue("network_hours");
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue("network_hours", JSON.stringify(value));
      },
    },
    overtime_hours: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue("overtime_hours");
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue("overtime_hours", JSON.stringify(value));
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
    },
  },
  {
    tableName: "metrics",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "idx_punchcode_monthyear",
        unique: false, // Make it false if duplicates are allowed
        fields: ["punch_code", "month_year"],
      },
      {
        name: "idx_punchcode",
        unique: false, // Make it false if duplicates are allowed
        fields: ["punch_code"],
      },
    ],
  }
);

module.exports = Metrics;
