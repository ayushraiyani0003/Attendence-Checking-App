async function redisMysqlAttendanceCompare(employees, redisAttendanceData, mysqlAttendanceData, groups, lockStatusData) {
  try {
    console.log("Redis data:", JSON.stringify(redisAttendanceData, null, 2));
    
    // Convert the Redis data into a lookup object for easier comparison
    const redisAttendanceLookup = {};
    
    redisAttendanceData.forEach((item) => {
      const { date, group, data } = item;
      
      // Parse the data string into JSON if it's a string
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      
      console.log(`Processing Redis data for date: ${date}, group: ${group}`);
      
      // Store data with multiple date formats to ensure matching
      const redisDate = new Date(date);
      // Format 1: "DD/MM/YYYY"
      const formattedDate1 = `${redisDate.getDate()}/${redisDate.getMonth() + 1}/${redisDate.getFullYear()}`;
      // Format 2: "YYYY-MM-DD" (ISO format)
      const formattedDate2 = date;
      
      [formattedDate1, formattedDate2].forEach(dateFormat => {
        if (!redisAttendanceLookup[dateFormat]) {
          redisAttendanceLookup[dateFormat] = {};
        }
        
        if (!redisAttendanceLookup[dateFormat][group]) {
          redisAttendanceLookup[dateFormat][group] = {};
        }
        
        // Handle array of employee records by mapping them by employee_id
        if (Array.isArray(parsedData)) {
          parsedData.forEach(empData => {
            console.log(`Adding employee ${empData.employee_id} data to lookup for date ${dateFormat}`);
            redisAttendanceLookup[dateFormat][group][empData.employee_id] = empData;
          });
        } else {
          // If it's a single record
          console.log(`Adding single employee ${parsedData.employee_id} data to lookup for date ${dateFormat}`);
          redisAttendanceLookup[dateFormat][group][parsedData.employee_id] = parsedData;
        }
      });
    });
    
    console.log("Redis lookup data:", JSON.stringify(redisAttendanceLookup, null, 2));

    // Prepare the final result to send
    const finalAttendanceData = [];

    // Loop through each employee's attendance data from MySQL
    for (const employee of mysqlAttendanceData) {
      const { employee_id, attendance_date, shift_type, network_hours, overtime_hours, reporting_group } = employee;

      console.log("Employee in Redis compare data: ", employee);
      
      console.log(`Processing MySQL data for employee_id: ${employee_id}, date: ${attendance_date}, group: ${reporting_group}`);

      // Check if reporting_group is undefined and set a default if needed
      const group = reporting_group || 'default';  // Use 'default' if group is not provided

      // Find the employee details by matching employee_id
      const employeeDetails = employees.find((emp) => emp.employee_id === employee_id);
      if (!employeeDetails) {
        console.log(`Employee with ID ${employee_id} not found.`);
        continue; // Skip if employee details are not found
      }

      // Initialize employee record if it doesn't exist
      let employeeRecord = finalAttendanceData.find((record) => record.id === employee_id);
      if (!employeeRecord) {
        employeeRecord = {
          id: employee_id,
          name: employeeDetails.name,
          punchCode: employeeDetails.punch_code,
          reporting_group: employeeDetails.reporting_group,
          designation: employeeDetails.designation,
          department: employeeDetails.department,
          attendance: [],
        };
        finalAttendanceData.push(employeeRecord);
      }

      // For each attendance, check if Redis has data to replace MySQL data
      const attendanceDate = new Date(attendance_date);
      // Format the date as "DD/M/YYYY"
      const formattedDate = `${attendanceDate.getDate()}/${attendanceDate.getMonth() + 1}/${attendanceDate.getFullYear()}`;
      // Also try ISO format
      const isoFormattedDate = attendance_date;
      
      const dayOfWeek = attendanceDate.toLocaleString('en-us', { weekday: 'long' });
      
      console.log(`Formatted date for comparison: ${formattedDate}, ISO: ${isoFormattedDate}`);

      // Determine lock status dynamically
      const lockStatus = determineLockStatus(
        attendance_date, 
        reporting_group || 'default', 
        lockStatusData
      );

      let attendanceRecord = {
        date: formattedDate,
        day: dayOfWeek,
        netHR: network_hours || 0,
        otHR: overtime_hours || 0,
        dnShift: shift_type || 'Off',
        lock_status: lockStatus,
      };
      
      let redisDataFound = false;
      
      // Try different date formats and check for all group names in the 'groups' array
      const possibleDates = [formattedDate, isoFormattedDate];
      
      for (const dateFormat of possibleDates) {
        for (const groupName of groups) {
          // Check if Redis data exists for this date, group, and employee_id
          if (
            redisAttendanceLookup[dateFormat] && 
            redisAttendanceLookup[dateFormat][groupName] &&
            redisAttendanceLookup[dateFormat][groupName][employee_id]
          ) {
            const redisData = redisAttendanceLookup[dateFormat][groupName][employee_id];
            console.log(`Found Redis data for employee ${employee_id} on date ${dateFormat} in group ${groupName}:`, redisData);
            
            // Replace MySQL data with Redis data if available
            attendanceRecord = {
              date: formattedDate,
              day: dayOfWeek,
              netHR: redisData.network_hours || attendanceRecord.netHR,
              otHR: redisData.overtime_hours || attendanceRecord.otHR,
              dnShift: redisData.shift_type || attendanceRecord.dnShift,
              // Preserve the original lock status from MySQL/determination
              lock_status: lockStatus,
            };
            
            redisDataFound = true;
            break;
          }
        }
        if (redisDataFound) break;
      }
      
      if (!redisDataFound) {
        console.log(`No Redis data found for employee ${employee_id} on date ${formattedDate}`);
      }

      // Add attendance record to the employee's attendance array
      employeeRecord.attendance.push(attendanceRecord);
    }

    // Return the final result
    return {
      action: 'attendanceData',
      attendance: finalAttendanceData,
    };
  } catch (error) {
    console.error('Error comparing Redis and MySQL attendance:', error);
    throw error;
  }
}

// Helper function to determine lock status
function determineLockStatus(date, group, lockStatusData) {
// Handle case where lockStatusData might be undefined or null
if (!lockStatusData || !Array.isArray(lockStatusData)) {
  return 'unlocked';
}

const formattedInputDate = new Date(date).toISOString().split('T')[0];
const lockEntry = lockStatusData.find(entry => 
  entry.date === formattedInputDate && 
  entry.reporting_group === group
);

return lockEntry ? lockEntry.status : 'unlocked';
}

module.exports = { redisMysqlAttendanceCompare };