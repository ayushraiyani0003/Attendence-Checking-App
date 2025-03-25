const cron = require("node-cron");
const { generateDailyAttendance } = require("../controllers/attendanceController");
const { getReportingGroupData } = require("../controllers/reportingGroupController")

// Cron job to generate attendance at 12:00 AM every day
cron.schedule('0 0 0 * * *', () => {
    console.log('Generating daily attendance...');
    try {
      generateDailyAttendance();
    } catch (error) {
      console.error('Error generating attendance:', error);
    }
    
    try {
      getReportingGroupData();
    } catch (error) {
      console.error('Error getting reporting group data:', error);
    }
  });
  