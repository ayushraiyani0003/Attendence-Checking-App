/**
 * Find mismatches between attendance data and metrics data by reporting group
 * Only count mismatches for dates that exist in metrics data
 * @param {Array} finalAttendanceData - Combined attendance data from MySQL and Redis
 * @param {Array} metricsData - Metrics data with punch codes and hours
 * @returns {Array} Array of objects with reporting groups and their mismatch counts
 */
function findMismatchesByGroup(finalAttendanceData, metricsData) {
  // Initialize results object to track mismatches by group
  const mismatchesByGroup = {};
  
  // Get current date dynamically
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  // Current year and month for filtering
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Create a map of valid punch codes and their metrics data
  // Group by punch_code and month_year for faster lookups
  const metricsMap = new Map();
  
  // Track which dates exist in the metrics data by punch code and month/year
  const availableDatesMap = new Map();
  
  // Process metrics data to build lookup maps
  for (const metric of metricsData) {
    if (!metric.dataValues?.punch_code || !metric.dataValues?.month_year) continue;
    
    const punchCode = metric.dataValues.punch_code;
    const monthYear = metric.dataValues.month_year;
    
    const key = `${punchCode}:${monthYear}`;
    metricsMap.set(key, metric);
    
    // Extract available dates from network_hours and overtime_hours
    try {
      const networkHoursArray = JSON.parse(metric.dataValues.network_hours || '[]');
      const overtimeHoursArray = JSON.parse(metric.dataValues.overtime_hours || '[]');
      
      // Get all dates from both arrays
      const datesWithData = new Set();
      
      // Add dates from network hours
      networkHoursArray.forEach(entry => {
        if (entry.date && entry.hours) {
          datesWithData.add(entry.date);
        }
      });
      
      // Add dates from overtime hours
      overtimeHoursArray.forEach(entry => {
        if (entry.date && entry.hours) {
          datesWithData.add(entry.date);
        }
      });
      
      // Store available dates for this punch code and month/year
      availableDatesMap.set(key, datesWithData);
    } catch (error) {
      // If parsing fails, assume no dates are available
      availableDatesMap.set(key, new Set());
    }
  }
  
  // Process each attendance record
  for (const attendance of finalAttendanceData) {
    if (!attendance.attendance_date || !attendance.reporting_group) continue;
    
    // Parse punch code
    const punchCode = parsePunchCode(attendance.punch_code);
    if (!punchCode) continue;
    
    // Track this group
    const group = attendance.reporting_group;
    
    if (mismatchesByGroup[group] === undefined) {
      mismatchesByGroup[group] = 0;
    }
    
    // Extract date components from attendance_date (format: 'YYYY-MM-DD')
    const [year, month, day] = attendance.attendance_date.split('-').map(Number);
    
    // Skip if not in the current month and year
    if (year !== currentYear || month !== currentMonth) {
      continue;
    }
    
    // Skip records with dates on or after today
    const attendanceDate = new Date(year, month - 1, day);
    if (attendanceDate >= currentDate) {
      continue;
    }
    
    // Format month_year key
    const monthYear = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Find matching metrics record by punch code and month_year
    const key = `${punchCode}:${monthYear}`;
    const matchingMetric = metricsMap.get(key);
    
    // If no matching metric found for this month/year combination, skip
    if (!matchingMetric) {
      continue;
    }
    
    // Check if this day exists in metrics data
    const availableDates = availableDatesMap.get(key);
    if (!availableDates) {
      continue;
    }
    
    // Skip days that don't exist in metrics data
    const dayString = day.toString();
    const paddedDay = dayString.padStart(2, '0');
    
    if (!availableDates.has(dayString) && !availableDates.has(paddedDay)) {
      continue;
    }
    
    // Parse hours data
    const { networkHours, overtimeHours } = getHoursForDay(matchingMetric, day);
    
    // Skip if no hours data found for this day
    if (networkHours === null && overtimeHours === null) {
      continue;
    }
    
    // Compare attendance hours with metrics hours
    compareAndCountMismatches(
      attendance, 
      networkHours, 
      overtimeHours, 
      mismatchesByGroup
    );
  }
  
  // Convert to array of objects for easier consumption
  return Object.entries(mismatchesByGroup).map(([group, count]) => ({
    group,
    mismatchCount: count
  }));
}

/**
 * Parse punch code from attendance record
 * @param {string|null} punchCodeData - Raw punch code data
 * @returns {string|null} - Parsed punch code or null
 */
function parsePunchCode(punchCodeData) {
  if (!punchCodeData) return null;
  
  try {
    // Try to parse as JSON in case it's stored as a JSON string
    if (typeof punchCodeData === 'string' && punchCodeData.startsWith('{')) {
      const punchCodeObj = JSON.parse(punchCodeData);
      return Object.values(punchCodeObj)[0] || null;
    }
    return punchCodeData;
  } catch (error) {
    // If parsing fails, use the raw punch_code value
    return punchCodeData;
  }
}

/**
 * Extract network and overtime hours for a specific day from metrics data
 * @param {Object} metric - Metrics data object
 * @param {number} day - Day of month
 * @returns {Object} Object with networkHours and overtimeHours
 */
function getHoursForDay(metric, day) {
  if (!metric?.dataValues) {
    return { networkHours: null, overtimeHours: null };
  }
  
  try {
    // Parse JSON strings to arrays
    const networkHoursArray = JSON.parse(metric.dataValues.network_hours || '[]');
    const overtimeHoursArray = JSON.parse(metric.dataValues.overtime_hours || '[]');
    
    // Possible formats for the day
    const dayString = day.toString();
    const paddedDay = dayString.padStart(2, '0');
    
    // Find matching entries
    const networkHourEntry = networkHoursArray.find(entry => 
      entry.date === dayString || entry.date === paddedDay
    );
    
    const overtimeHourEntry = overtimeHoursArray.find(entry => 
      entry.date === dayString || entry.date === paddedDay
    );
    
    return {
      networkHours: networkHourEntry ? parseFloat(networkHourEntry.hours) : 0,
      overtimeHours: overtimeHourEntry ? parseFloat(overtimeHourEntry.hours) : 0
    };
  } catch (error) {
    return { networkHours: null, overtimeHours: null };
  }
}

/**
 * Compare attendance and metrics hours and count mismatches
 * @param {Object} attendance - Attendance record
 * @param {number|null} metricsNetworkHours - Network hours from metrics
 * @param {number|null} metricsOvertimeHours - Overtime hours from metrics
 * @param {Object} mismatchesByGroup - Mismatch counter object
 */
function compareAndCountMismatches(
  attendance, 
  metricsNetworkHours, 
  metricsOvertimeHours, 
  mismatchesByGroup
) {
  // Use a larger epsilon value (0.25) for floating point comparison as specified
  const epsilon = 0.25;
  const group = attendance.reporting_group;
  
  // Handle null values in attendance hours
  const attendanceNetworkHours = attendance.network_hours === null ? 0 : parseFloat(attendance.network_hours);
  const attendanceOvertimeHours = attendance.overtime_hours === null ? 0 : parseFloat(attendance.overtime_hours);
  
  // Only compare if metrics hours are not null
  if (metricsNetworkHours !== null) {
    const networkHoursMatch = Math.abs(attendanceNetworkHours - metricsNetworkHours) <= epsilon;
    if (!networkHoursMatch) {
      mismatchesByGroup[group]++;
    }
  }
  
  if (metricsOvertimeHours !== null) {
    const overtimeHoursMatch = Math.abs(attendanceOvertimeHours - metricsOvertimeHours) <= epsilon;
    if (!overtimeHoursMatch) {
      mismatchesByGroup[group]++;
    }
  }
}

module.exports = { findMismatchesByGroup };