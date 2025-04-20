const cron = require("node-cron");
const { generateDailyAttendance } = require("../controllers/attendanceController");
const { getReportingGroupData } = require("../controllers/reportingGroupController")
const { getAllAttendenceDataFromRedis,deleteRedisGroupKeysForSelectedDate } = require("./getRedisAttendenceData");
const {updateAttendanceFromRedisBySystumn} = require("../services/attendenceService");
const AttendanceChangeLogService = require('../services/AttendanceChangeLogService');
const redisClient = require('../config/redisConfig'); // Adjust path to your Redis client
const Session = require("../models/session")


// Cron job to generate attendance at 12:00 AM every day
cron.schedule('0 30 0 * * *', () => {
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
cron.schedule('30 14 * * *', async () => {
  try {
    const allDates = [];
    const allGroups = [];

    // Get all attendance data from Redis
    const redisAttData = await getAllAttendenceDataFromRedis();
    // console.log('Redis Attendance Data:', redisAttData);

    // Call the function to update attendance data from Redis to MySQL
    const result = await updateAttendanceFromRedisBySystumn(redisAttData);

    // Handle success
    if (result.success) {
      // console.log(`${result.updatedRecords} records updated successfully.`);
      
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

      // console.log('All Dates:', allDates);
      // console.log('All Groups:', allGroups);

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

cron.schedule('0 0 * * *', async () => {
  try {
    // console.log('Running daily session cleanup...');
    await Session.cleanupOldSessions();
    console.log('Daily session cleanup completed');
  } catch (error) {
    console.error('Error in daily session cleanup:', error);
  }
});

cron.schedule('0 0 * * *', async () => {
  try {
    // console.log('Running weekly session cleanup...');
    await Session.cleanupWeekOldSessions();
    console.log('Weekly session cleanup completed');
  } catch (error) {
    console.error('Error in weekly session cleanup:', error);
  }
});

const logService = new AttendanceChangeLogService();

// Cron job to sync logs from Redis to MySQL every 2 minutes
// Format: '*/2 * * * *' means "every 2 minutes"
cron.schedule('*/2 * * * *', async () => {
  try {
    console.log('Running Redis to MySQL log sync...');
    
    // Sync logs from Redis to MySQL (the service already handles duplicate prevention)
    const syncedCount = await logService.syncLogsFromRedis();
    
    console.log(`Redis to MySQL log sync completed. Synced ${syncedCount} new logs.`);
  } catch (error) {
    console.error('Error in Redis to MySQL log sync:', error);
  }
});

// Cron job to clean up Redis logs at midnight (0 0 * * *)
cron.schedule('30 8 7 * * *', async () => {
  try {
    console.log('Running Redis logs cleanup...');
    
    // Get all logs from Redis
    const logsKey = logService.logsKey;
    const logsJson = await redisClient.get(logsKey);
    
    if (logsJson) {
      const logs = JSON.parse(logsJson);
      
      if (logs.length > 0) {
        console.log(`Found ${logs.length} logs in Redis before cleanup`);
        
        // Before deleting, ensure all logs are synced to MySQL
        await logService.syncLogsFromRedis();
        
        // Reset logs to empty array
        await redisClient.set(logsKey, JSON.stringify([]));
        
        console.log('Redis logs cleanup completed - All logs cleared');
      } else {
        console.log('No logs found in Redis to clean up');
      }
    } else {
      console.log('No logs key found in Redis');
    }
  } catch (error) {
    console.error('Error in Redis logs cleanup:', error);
  }
});