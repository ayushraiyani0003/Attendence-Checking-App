const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Adjust this path to your DB connection

module.exports = (sequelize, DataTypes) => {
  const AttendanceUnlockRequest = sequelize.define(
    "AttendanceUnlockRequest",
    {
      request_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      requested_by: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      requested_by_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      requested_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      requested_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      request_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
          isIn: [['pending', 'approved', 'rejected']]
        }
      },
      status_by: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      requested_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      }
    },
    {
      tableName: "attendance_unlock_requests",
      timestamps: true, // Enables createdAt and updatedAt
      underscored: true, // Converts camelCase to snake_case
    }
  );

  return AttendanceUnlockRequest;
};