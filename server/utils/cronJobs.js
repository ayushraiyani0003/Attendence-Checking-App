const cron = require("node-cron");
const { generateDailyAttendance } = require("../controllers/attendanceController");
const { getReportingGroupData } = require("../controllers/reportingGroupController")

// Cron job to generate attendance at 12:00 AM every day
cron.schedule('0 0 * * *', () => { // change 9 to 0 
  console.log('Generating daily attendance...');
//   generateDailyAttendance();
  getReportingGroupData();
});
