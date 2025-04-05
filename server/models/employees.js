const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Adjust this path to your DB connection

module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define(
    "employees",
    {
      employee_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      department: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      punch_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      designation: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      reporting_group: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      net_hr: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: "Net hours an employee works",
      },
      week_off: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Weekly off days",
      },
      resign_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Date of resignation if applicable",
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'resigned', 'on_leave'),
        defaultValue: 'active',
        allowNull: false,
        comment: "Current employment status",
      },
      branch: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Branch location of the employee",
      },
      sections: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Sections or teams the employee belongs to",
      },
    },
    {
      tableName: "employees",
      timestamps: true, // Sequelize will automatically manage createdAt and updatedAt columns
      underscored: true, // Converts camelCase to snake_case (e.g., 'created_at')
    }
  );

  return Employee;
};