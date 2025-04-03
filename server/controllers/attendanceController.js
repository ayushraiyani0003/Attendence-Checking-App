const redisClient = require('../config/redisConfig');
const { Employee, Attendance } = require("../models");

const generateDailyAttendance = async () => {
  try {
    // Verify Redis connection before proceeding
    console.log("generte daily attendence is called");
    
    if (!redisClient.isReady) {
      console.error('Redis client is not connected. Cannot proceed.');
      return;
    }

    // Get current UTC time
    const currentDate = new Date();
    console.log(currentDate);
    

    // Convert UTC time to IST by adding 5 hours and 30 minutes (IST = UTC + 5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const istDate = new Date(currentDate.getTime() + istOffset);
    console.log(istDate);
    // Subtract one day from the IST date to get yesterday's date
    istDate.setDate(istDate.getDate() - 1);

    // Format date as YYYY-MM-DD
    const formattedDate = istDate.toISOString().split('T')[0];
    //console.log(`Generating attendance for date: ${formattedDate}`);

    // Get all employees
    const employees = await Employee.findAll();
    //console.log(`Found ${employees.length} employees`);

    // Process each employee
    for (const employee of employees) {
      try {
        const employeeId = employee.employee_id;
        const reportingGroup = employee.reporting_group || 'default';

        // Prepare the Redis key for the group and date
        const redisKey = `attendance:${reportingGroup}:${formattedDate}`;
        //console.log(`Processing employee ${employeeId} for group ${reportingGroup}`);

        // 1. Check MySQL database
        const existingAttendance = await Attendance.findOne({
          where: {
            employee_id: employeeId,
            attendance_date: formattedDate,
          },
        });

        // 2. Check Redis database
        let attendanceData = [];
        let redisHasRecord = false;

        try {
          const cachedData = await redisClient.get(redisKey);
          if (cachedData) {
            attendanceData = JSON.parse(cachedData);
            // Check if this employee exists in Redis data
            redisHasRecord = attendanceData.some(record => record.employee_id === employeeId);
            //console.log(`Redis data for ${redisKey} found: ${attendanceData.length} records`);
          } else {
            //console.log(`No Redis data found for ${redisKey}`);
          }
        } catch (redisError) {
          console.error(`Error retrieving data from Redis for key ${redisKey}:`, redisError);
        }

        // 3. Handle all four possible cases
        const mysqlHasRecord = !!existingAttendance;

        //console.log(`Status for employee ${employeeId}: MySQL=${mysqlHasRecord}, Redis=${redisHasRecord}`);

        // Case 1: Both have records - do nothing
        if (mysqlHasRecord && redisHasRecord) {
          //console.log(`Attendance already exists in both databases for employee ${employeeId}`);
          continue;
        }

        // Case 2: MySQL has record but Redis doesn't - add to Redis
        if (mysqlHasRecord && !redisHasRecord) {
          //console.log(`Adding employee ${employeeId} to Redis`);
          const newRedisRecord = {
            employee_id: employeeId,
            attendance_date: formattedDate,
            shift_type: existingAttendance.shift_type,
            network_hours: existingAttendance.network_hours,
            overtime_hours: existingAttendance.overtime_hours,
            comment: existingAttendance.comment,
          };
          attendanceData.push(newRedisRecord);

          try {
            await redisClient.set(redisKey, JSON.stringify(attendanceData), {});
            //console.log(`Updated Redis for key ${redisKey} with employee ${employeeId}`);
          } catch (redisSetError) {
            console.error(`Failed to update Redis for key ${redisKey}:`, redisSetError);
          }
          continue;
        }

        // Case 3: Redis has record but MySQL doesn't - add to MySQL
        if (!mysqlHasRecord && redisHasRecord) {
          //console.log(`Adding employee ${employeeId} to MySQL`);
          const redisRecord = attendanceData.find(record => record.employee_id === employeeId);

          await Attendance.create({
            employee_id: employeeId,
            attendance_date: formattedDate,
            shift_type: redisRecord.shift_type || 'D',
            network_hours: redisRecord.network_hours || 0,
            overtime_hours: redisRecord.overtime_hours || 0,
            comment: redisRecord.comment || '',
          });
          //console.log(`Added employee ${employeeId} to MySQL`);
          continue;
        }

        // Case 4: Neither has record - add to both
        if (!mysqlHasRecord && !redisHasRecord) {
          //console.log(`Adding employee ${employeeId} to both databases`);

          // Create in MySQL
          await Attendance.create({
            employee_id: employeeId,
            attendance_date: formattedDate,
            shift_type: 'D',
            network_hours: 0,
            overtime_hours: 0,
            comment: '',
          });

          // Add to Redis
          attendanceData.push({
            employee_id: employeeId,
            attendance_date: formattedDate,
            shift_type: 'D',
            network_hours: 0,
            overtime_hours: 0,
            comment: '',
          });

          try {
            await redisClient.set(redisKey, JSON.stringify(attendanceData), {});
            //console.log(`Updated Redis for key ${redisKey} with new employee ${employeeId}`);
          } catch (redisSetError) {
            console.error(`Failed to update Redis for key ${redisKey}:`, redisSetError);
          }
        }
      } catch (employeeError) {
        console.error(`Error processing employee ${employee.employee_id}:`, employeeError);
        console.log(`Error processing employee ${employee.employee_id}:`, employeeError);
        // Continue with next employee
      }
    }

    //console.log('Attendance records generated and stored for all employees!');
  } catch (error) {
    console.error('Error generating daily attendance:', error);
  }
};

module.exports = { generateDailyAttendance };
