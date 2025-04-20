const { Sequelize, DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const AttendanceChangeLog = sequelize.define(
    "AttendanceChangeLog",
    {
      log_id: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        allowNull: false,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      attendance_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      update_datetime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      field: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      new_value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      old_value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      changed_by_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      changed_by: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      employee_punch_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      employee_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      employee_department: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      employee_reporting_group: {
        type: DataTypes.TEXT,
        allowNull: true,
      }
    },
    {
      tableName: "attendance_change_logs",
      timestamps: true,
      underscored: true
    }
  );

  return AttendanceChangeLog;
};