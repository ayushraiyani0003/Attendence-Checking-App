const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Adjust this path to your DB connection

module.exports = (sequelize, DataTypes) => {
  const AttendanceDateLockStatus = sequelize.define(
    "AttendanceDateLockStatus",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      reporting_group_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      attendance_date: {
        type: DataTypes.DATEONLY, // Use DATEONLY for the date field
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('locked', 'unlocked'),
        allowNull: true,
      },
      locked_by: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "attendance_date_lock_status",
      timestamps: true, // No createdAt or updatedAt columns
      underscored: true, // Converts camelCase to snake_case (e.g., 'created_at')
    }
  );

  return AttendanceDateLockStatus;
};
