// cronJobs.js

const cron = require("node-cron");
const { generateDailyAttendance, autoSubmitAttendance } = require("./controllers/attendanceController");

// Cron job to generate attendance at 12:00 AM every day
cron.schedule('0 0 * * *', () => {
  console.log('Generating daily attendance and unlocking columns...');
  generateDailyAttendance();
});

// Cron job to auto-submit attendance at 8:00 PM every day if not submitted
cron.schedule('0 20 * * *', () => {
  console.log('Auto submitting attendance and locking columns...');
  autoSubmitAttendance();
});
