const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Adjust this path to your DB connection

module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define(
    "Attendance",
    {
      attendance_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      attendance_date: {
        type: DataTypes.DATEONLY, // DATEONLY type is used for date fields in Sequelize
        allowNull: true,
      },
      shift_type: {
        type: DataTypes.STRING(11),
        allowNull: true,
      },
      network_hours: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      overtime_hours: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "Attendance",
      timestamps: true, // This model does not have createdAt or updatedAt columns
      underscored: true, // Converts camelCase to snake_case (e.g., 'created_at')
    }
  );

  return Attendance;
};
