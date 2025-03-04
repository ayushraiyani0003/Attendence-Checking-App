const { Sequelize } = require('sequelize');
const sequelize = require('../config/db'); // This is where you import the sequelize instance

const Department = require('./department')(sequelize, Sequelize.DataTypes);
const Designation = require('./designation')(sequelize, Sequelize.DataTypes);
  const ReportingGroup = require('./reportingGroup')(sequelize, Sequelize.DataTypes);
// Export models for use in controllers
module.exports = {
  sequelize,
  Department,
  Designation,
  ReportingGroup
};
