const cron = require("node-cron");
const { generateDailyAttendance } = require("../controllers/attendanceController");
const { getReportingGroupData } = require("../controllers/reportingGroupController")
const { getAllAttendenceDataFromRedis,deleteRedisGroupKeysForSelectedDate } = require("./getRedisAttendenceData");
const {updateAttendanceFromRedisBySystumn} = require("../services/attendenceService")

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

// make a conns sedual for run the all attndence update as redis one in mysql. all attendence are update and update all status as lock status
cron.schedule('00 00 20 * * *', async () => {
  try {
    const allDates = [];
    const allGroups = [];

    // Get all attendance data from Redis
    const redisAttData = await getAllAttendenceDataFromRedis();
    console.log('Redis Attendance Data:', redisAttData);

    // Call the function to update attendance data from Redis to MySQL
    const result = await updateAttendanceFromRedisBySystumn(redisAttData);

    // Handle success
    if (result.success) {
      console.log(`${result.updatedRecords} records updated successfully.`);
      
      // Extract unique dates and groups
      redisAttData.forEach(item => {
        const keyParts = item.key.split(':');
        const group = keyParts[1];
        const date = keyParts[2];
        
        if (!allGroups.includes(group)) {
          allGroups.push(group);
        }
        
        if (!allDates.includes(date)) {
          allDates.push(date);
        }
      });

      console.log('All Dates:', allDates);
      console.log('All Groups:', allGroups);

      // Delete Redis keys for each date and group combination
      for (const date of allDates) {
        await deleteRedisGroupKeysForSelectedDate(date, allGroups);
      }

    } else {
      console.error('Error updating attendance:', result.error);
    }
  } catch (error) {
    console.error('Error in cron job:', error);
  }
});