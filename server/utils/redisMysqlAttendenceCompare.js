async function redisMysqlAttendanceCompare(employees, redisAttendanceData, mysqlAttendanceData, groups, lockStatusData) {
  try {
    console.log("Redis data:", JSON.stringify(redisAttendanceData, null, 2));
    
    // Convert the Redis data into a lookup object for easier comparison
    const redisAttendanceLookup = {};
    
    redisAttendanceData.forEach((item) => {
      const { date, group, data } = item;
      
      // Parse the data string into JSON if it's a string
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      
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
            redisAttendanceLookup[dateFormat][group][empData.employee_id] = empData;
          });
        } else {
          // If it's a single record
          redisAttendanceLookup[dateFormat][group][parsedData.employee_id] = parsedData;
        }
      });
    });

    // Prepare the final result to send
    const finalAttendanceData = [];

    // Loop through each employee's attendance data from MySQL
    for (const employee of mysqlAttendanceData) {
      const { employee_id, attendance_date, shift_type, network_hours, overtime_hours, comment, reporting_group } = employee;
      
      // Check if reporting_group is undefined and set a default if needed
      const group = reporting_group || 'default';  // Use 'default' if group is not provided

      // Find the employee details by matching employee_id
      const employeeDetails = employees.find((emp) => emp.employee_id === employee_id);
      if (!employeeDetails) {
        continue; // Skip if employee details are not found
      }

      // NEW: Check for inactive status or if attendance is after resignation date
      if (employeeDetails.status === "inactive") {
        console.log(`Skipping inactive employee with ID ${employee_id}`);
        continue; // Skip inactive employees
      }

      // NEW: Check resignation date
      if (employeeDetails.resign_date !== null && employeeDetails.resign_date !== undefined) {
        const resignDate = new Date(employeeDetails.resign_date);
        const attendanceDate = new Date(attendance_date);
        
        // Skip if attendance date is after resignation date
        if (attendanceDate > resignDate) {
          console.log(`Skipping record for employee ${employee_id}, attendance date ${attendance_date} is after resignation date ${employeeDetails.resign_date}`);
          continue;
        }
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
        comment: comment || '',
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
            
            // NEW: Skip this record if the employee is inactive in Redis data
            if (redisData.status === "inactive") {
              console.log(`Skipping record for employee ${employee_id} because status is inactive in Redis data`);
              redisDataFound = true;
              continue;
            }
            
            // Replace MySQL data with Redis data if available
            attendanceRecord = {
              date: formattedDate,
              day: dayOfWeek,
              netHR: redisData.network_hours || attendanceRecord.netHR,
              otHR: redisData.overtime_hours || attendanceRecord.otHR,
              dnShift: redisData.shift_type || attendanceRecord.dnShift,
              comment: redisData.comment|| attendanceRecord.comment,
              // Preserve the original lock status from MySQL/determination
              lock_status: lockStatus,
            };
            
            redisDataFound = true;
            break;
          }
        }
        if (redisDataFound) break;
      }

      // Add attendance record to the employee's attendance array
      employeeRecord.attendance.push(attendanceRecord);
    }

    // NEW: Final check to remove any employee records with empty attendance arrays
    // This handles cases where all attendance records were filtered out
    const filteredAttendanceData = finalAttendanceData.filter(
      (employee) => employee.attendance && employee.attendance.length > 0
    );

    // Return the final result
    return {
      action: 'attendanceData',
      attendance: filteredAttendanceData,
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