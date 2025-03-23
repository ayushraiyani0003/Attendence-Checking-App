const { Sequelize } = require("sequelize");
const sequelize = require("../config/db"); // The Sequelize instance

// Import each model and pass in the sequelize instance and DataTypes
const Department = require("./department")(sequelize, Sequelize.DataTypes);
const Designation = require("./designation")(sequelize, Sequelize.DataTypes);
const ReportingGroup = require("./reportingGroup")(sequelize, Sequelize.DataTypes);
const Employee = require("./employees")(sequelize, Sequelize.DataTypes);
const Attendance = require("./attendance")(sequelize, Sequelize.DataTypes);
const AttendanceDateLockStatus = require("./attendanceDateLockStatus")(sequelize, Sequelize.DataTypes);
const Audit = require("./audit")(sequelize, Sequelize.DataTypes);

// Export models for use in controllers
module.exports = {
  sequelize,
  Department,
  Designation,
  ReportingGroup,
  Employee,
  Attendance,
  AttendanceDateLockStatus,
  Audit,
};
