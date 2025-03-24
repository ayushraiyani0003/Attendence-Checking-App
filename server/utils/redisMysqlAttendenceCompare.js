async function redisMysqlAttendanceCompare(employees, redisAttendanceData, mysqlAttendanceData, groups) {
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
            name: employeeDetails.name,  // Use the employee name from employee details
            punchCode: employeeDetails.punch_code, // Use punch code from employee details
            designation: employeeDetails.designation, // Use designation from employee details
            department: employeeDetails.department, // Use department from employee details
            attendance: [],
          };
          finalAttendanceData.push(employeeRecord);
        }
  
        // For each attendance, check if Redis has data to replace MySQL data
        const attendanceDate = new Date(attendance_date);
        // Format the date as "DD/M/YYYY" (note: using M not MM to match your example "23/3/2025")
        const formattedDate = `${attendanceDate.getDate()}/${attendanceDate.getMonth() + 1}/${attendanceDate.getFullYear()}`;
        // Also try ISO format
        const isoFormattedDate = attendance_date;
        
        const dayOfWeek = attendanceDate.toLocaleString('en-us', { weekday: 'long' });
        
        console.log(`Formatted date for comparison: ${formattedDate}, ISO: ${isoFormattedDate}`);
  
        let attendanceRecord = {
          date: formattedDate,
          day: dayOfWeek,
          netHR: network_hours || 0,
          otHR: overtime_hours || 0,
          dnShift: shift_type || 'Off',
          lock_status: 'unlocked', // Default status, could be changed if needed
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
                lock_status: 'locked', // Assuming locked when Redis data is available
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
  
  module.exports = { redisMysqlAttendanceCompare };
