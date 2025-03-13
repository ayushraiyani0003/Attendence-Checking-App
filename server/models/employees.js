const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust this path to your DB connection

module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define('Employee', {
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
  }, {
    tableName: 'Employees',
    timestamps: true, // Sequelize will automatically manage createdAt and updatedAt columns
    underscored: true, // Converts camelCase to snake_case (e.g., 'created_at')
  });

  return Employee;
};
