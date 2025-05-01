async function redisMysqlAttendanceCompare(employees, redisAttendanceData, mysqlAttendanceData, groups, lockStatusData) {
  try {
    // Create a Map for faster employee lookups instead of using .find()
    const employeesMap = new Map();
    for (const emp of employees) {
      employeesMap.set(emp.employee_id, emp);
    }

    // Create a Map for lock status lookups
    const lockStatusMap = new Map();
    if (lockStatusData && Array.isArray(lockStatusData)) {
      for (const entry of lockStatusData) {
        const key = `${entry.date}_${entry.reporting_group}`;
        lockStatusMap.set(key, entry.status);
      }
    }

    // Create a more efficient Redis data lookup structure with a single combined key
    const redisDataMap = new Map();
    for (const item of redisAttendanceData) {
      const { date, group, data } = item;
      
      // Parse data only once
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Get both date formats at once
      const redisDate = new Date(date);
      const formattedDate1 = `${redisDate.getDate()}/${redisDate.getMonth() + 1}/${redisDate.getFullYear()}`;
      
      // Store data with employee_id as part of the key for direct lookup
      if (Array.isArray(parsedData)) {
        for (const empData of parsedData) {
          // Use composite keys for both date formats
          redisDataMap.set(`${formattedDate1}_${group}_${empData.employee_id}`, empData);
          redisDataMap.set(`${date}_${group}_${empData.employee_id}`, empData);
        }
      } else if (parsedData && parsedData.employee_id) {
        redisDataMap.set(`${formattedDate1}_${group}_${parsedData.employee_id}`, parsedData);
        redisDataMap.set(`${date}_${group}_${parsedData.employee_id}`, parsedData);
      }
    }

    // Pre-calculate the day names for all attendance dates to avoid repetitive calculations
    const dayNameCache = new Map();
    
    // Create a map of employee records to avoid searching the array repeatedly
    const employeeRecordsMap = new Map();
    const finalAttendanceData = [];

    // Process MySQL attendance data in a single pass
    for (const employee of mysqlAttendanceData) {
      const { employee_id, attendance_date, shift_type, network_hours, overtime_hours, comment, reporting_group } = employee;
      
      // Fast lookup instead of find
      const employeeDetails = employeesMap.get(employee_id);
      if (!employeeDetails) continue;

      // Skip inactive employees
      if (employeeDetails.status === "inactive") continue;

      // Check resignation date efficiently
      if (employeeDetails.resign_date) {
        const resignDate = new Date(employeeDetails.resign_date);
        const attendanceDate = new Date(attendance_date);
        if (attendanceDate > resignDate) continue;
      }

      // Get or create employee record using map for faster lookups
      let employeeRecord = employeeRecordsMap.get(employee_id);
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
        employeeRecordsMap.set(employee_id, employeeRecord);
        finalAttendanceData.push(employeeRecord);
      }

      const attendanceDate = new Date(attendance_date);
      const formattedDate = `${attendanceDate.getDate()}/${attendanceDate.getMonth() + 1}/${attendanceDate.getFullYear()}`;
      
      // Use the dayNameCache to avoid recalculating day names
      let dayOfWeek = dayNameCache.get(attendance_date);
      if (!dayOfWeek) {
        dayOfWeek = attendanceDate.toLocaleString('en-us', { weekday: 'long' });
        dayNameCache.set(attendance_date, dayOfWeek);
      }

      // Determine lock status using the map - handle string or Date object
      // Make sure we have a proper date string format for lookup
      const dateStr = typeof attendance_date === 'string' ? 
        attendance_date.split('T')[0] : // Handle ISO string format
        new Date(attendance_date).toISOString().split('T')[0]; // Handle Date object or other formats
      
      const lockKey = `${dateStr}_${reporting_group || 'default'}`;
      const lockStatus = lockStatusMap.get(lockKey) || 'unlocked';

      // Create the attendance record once
      const attendanceRecord = {
        date: formattedDate,
        day: dayOfWeek,
        netHR: network_hours !== undefined && network_hours !== null ? network_hours : 0,
        otHR: overtime_hours !== undefined && overtime_hours !== null ? overtime_hours : 0,
        dnShift: shift_type || 'Off',
        lock_status: lockStatus,
        comment: comment || '',
      };
      
      // Check Redis data for all groups at once
      let redisData = null;
      const group = reporting_group || 'default';
      
      // First try with the exact group
      redisData = redisDataMap.get(`${formattedDate}_${group}_${employee_id}`) || 
                 redisDataMap.get(`${attendance_date}_${group}_${employee_id}`);
      
      // If not found, try with other groups only if necessary
      if (!redisData && groups.length > 1) {
        for (const groupName of groups) {
          if (groupName === group) continue; // Skip already checked group
          
          redisData = redisDataMap.get(`${formattedDate}_${groupName}_${employee_id}`) || 
                     redisDataMap.get(`${attendance_date}_${groupName}_${employee_id}`);
          
          if (redisData) break;
        }
      }
      
      // Update the attendance record with Redis data if found
      if (redisData) {
        // Skip if the employee is inactive in Redis
        if (redisData.status === "inactive") continue;
        
        // Update only the fields that exist in Redis data
        if (redisData.network_hours !== undefined && redisData.network_hours !== null) {
          attendanceRecord.netHR = parseFloat(redisData.network_hours);
        }
        
        if (redisData.overtime_hours !== undefined && redisData.overtime_hours !== null) {
          attendanceRecord.otHR = parseFloat(redisData.overtime_hours);
        }
        
        if (redisData.shift_type) {
          attendanceRecord.dnShift = redisData.shift_type;
        }
        
        if (redisData.comment) {
          attendanceRecord.comment = redisData.comment;
        }
      }
      
      // Add attendance record to the employee's attendance array
      employeeRecord.attendance.push(attendanceRecord);
    }

    // Filter out employees with no attendance in one pass (no need for separate filter)
    const resultData = finalAttendanceData.filter(emp => emp.attendance.length > 0);

    // Return the final result
    return {
      action: 'attendanceData',
      attendance: resultData,
    };
  } catch (error) {
    console.error('Error comparing Redis and MySQL attendance:', error);
    throw error;
  }
}

module.exports = { redisMysqlAttendanceCompare };