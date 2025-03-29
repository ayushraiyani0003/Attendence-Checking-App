// quickFunction.js
const {addAttendanceToMySQL} = require("../services/attendenceService");
const {checkDataAvailableInRedis,addAttendanceToRedis} = require("../utils/getRedisAttendenceData");

function convertMonthToYearMonthFormat(monthString) {
  const months = {
    'Jan': 1,
    'Feb': 2,
    'Mar': 3,
    'Apr': 4,
    'May': 5,
    'Jun': 6,
    'Jul': 7,
    'Aug': 8,
    'Sep': 9,
    'Oct': 10,
    'Nov': 11,
    'Dec': 12
  };

  // Split the monthString into month abbreviation and year
  const [monthAbbr, year] = monthString.split(' ');

  // Convert month abbreviation to number
  const month = months[monthAbbr];

  // Return an object with year and month separately
  return { year, month };
}

const getAttendanceDateRange = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  // Calculate start date (beginning of the month)
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // If today is the first day of the month, no need to add attendance
  if (today.getDate() === 1) {
    return { shouldAddAttendance: false };
  }
  
  return {
    shouldAddAttendance: true,
    startDate,
    endDate: yesterday,
    formattedYesterday: formatDate(yesterday)
  };
}

// Format date to YYYY-MM-DD format
const formatDate = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Generate date range array between start and end dates
const generateDateRange = (startDate, endDate) => {
  const dates = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(formatDate(new Date(currentDate)));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

// Process attendance for a new employee
const processNewEmployeeAttendance = async (employeeId, reportingGroup) => {
  try {
    // Get date range for which to add attendance
    const dateRange = getAttendanceDateRange();
    
    // If it's the first day of the month, no need to add attendance
    if (!dateRange.shouldAddAttendance) {
      return {
        success: true,
        message: "No attendance records needed (first day of month)"
      };
    }
    
    // Generate array of dates for which to add attendance
    const dates = generateDateRange(dateRange.startDate, dateRange.endDate);
    const results = [];
    
    // Process each date
    for (const date of dates) {
      // Default attendance data
      const attendanceData = {
        employee_id: employeeId,
        attendance_date: date,
        shift_type: "D", // Default shift type
        network_hours: 0,
        overtime_hours: 0
      };
      
      // Add to MySQL for all dates
      const mysqlResult = await addAttendanceToMySQL(attendanceData);
      results.push({ date, mysql: mysqlResult });
      
      // Check if data for this date and reporting group is available in Redis
      const redisAvailability = await checkDataAvailableInRedis(date, reportingGroup);
      
      // If data is available in Redis, add attendance to Redis as well
      if (redisAvailability.available) {
        const redisResult = await addAttendanceToRedis(
          employeeId,
          date,
          reportingGroup,
          {
            shift_type: attendanceData.shift_type,
            network_hours: attendanceData.network_hours,
            overtime_hours: attendanceData.overtime_hours
          }
        );
        results[results.length - 1].redis = redisResult;
      }
    }
    
    return {
      success: true,
      processedDates: results
    };
  } catch (error) {
    console.error('Error processing new employee attendance:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export the function to be used in other files
module.exports = {
  getAttendanceDateRange,
convertMonthToYearMonthFormat,
formatDate,
generateDateRange,
processNewEmployeeAttendance
};
