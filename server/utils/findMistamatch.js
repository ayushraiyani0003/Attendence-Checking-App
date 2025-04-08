/**
 * Find mismatches between attendance data and metrics data by reporting group
 * @param {Array} finalAttendanceData - Combined attendance data from MySQL and Redis
 * @param {Array} metricsData - Metrics data with punch codes and hours
 * @returns {Object} Object with reporting groups as keys and mismatch count as values
 */
function findMismatchesByGroup(finalAttendanceData, metricsData) {
    // Initialize results object to track mismatches by group
    const mismatchesByGroup = {};
    
    // Process each attendance record
    for (const attendance of finalAttendanceData) {
      // Extract date components from attendance_date (format: 'YYYY-MM-DD')
      const [year, month, day] = attendance.attendance_date.split('-');
      const monthYear = `${year}-${month}`;
      const dayOfMonth = day.replace(/^0+/, ''); // Remove leading zeros
      
      // Get employee id (assuming this is the punch code needed to match with metrics)
      const punchCode = attendance.employee_id.toString();
      
      // Find matching metrics record by punch code and month_year
      const matchingMetric = metricsData.find(metric => 
        metric.dataValues && 
        metric.dataValues.punch_code === punchCode && 
        metric.dataValues.month_year === monthYear
      );
      
      // If no matching metric found, count as mismatch
      if (!matchingMetric) {
        // Initialize group counter if not exists
        if (!mismatchesByGroup[attendance.reporting_group]) {
          mismatchesByGroup[attendance.reporting_group] = 0;
        }
        mismatchesByGroup[attendance.reporting_group]++;
        continue;
      }
      
      // Parse network_hours and overtime_hours from metrics
      let metricsNetworkHours, metricsOvertimeHours;
      
      try {
        // Parse JSON strings to arrays
        const networkHoursArray = JSON.parse(matchingMetric.dataValues.network_hours);
        const overtimeHoursArray = JSON.parse(matchingMetric.dataValues.overtime_hours);
        
        // Find corresponding date entries
        const networkHourEntry = networkHoursArray.find(entry => entry.date === dayOfMonth);
        const overtimeHourEntry = overtimeHoursArray.find(entry => entry.date === dayOfMonth);
        
        // Extract hours, handle case where entry might not exist
        metricsNetworkHours = networkHourEntry ? parseFloat(networkHourEntry.hours) : 0;
        metricsOvertimeHours = overtimeHourEntry ? parseFloat(overtimeHourEntry.hours) : 0;
      } catch (error) {
        console.error("Error parsing metrics hours data:", error);
        // Count parsing error as mismatch
        if (!mismatchesByGroup[attendance.reporting_group]) {
          mismatchesByGroup[attendance.reporting_group] = 0;
        }
        mismatchesByGroup[attendance.reporting_group]++;
        continue;
      }
      
      // Compare attendance hours with metrics hours
      // Use a small epsilon value for floating point comparison to handle minor precision differences
      const epsilon = 0.01;
      const networkHoursMatch = Math.abs(attendance.network_hours - metricsNetworkHours) < epsilon;
      const overtimeHoursMatch = Math.abs(attendance.overtime_hours - metricsOvertimeHours) < epsilon;
      
      // If either network hours or overtime hours don't match, count as mismatch
      if (!networkHoursMatch || !overtimeHoursMatch) {
        // Initialize group counter if not exists
        if (!mismatchesByGroup[attendance.reporting_group]) {
          mismatchesByGroup[attendance.reporting_group] = 0;
        }
        mismatchesByGroup[attendance.reporting_group]++;
      }
    }
    
    // Add groups with zero mismatches to ensure all groups are represented
    for (const attendance of finalAttendanceData) {
      const group = attendance.reporting_group;
      if (mismatchesByGroup[group] === undefined) {
        mismatchesByGroup[group] = 0;
      }
    }
    
    // Convert to array of objects for easier consumption
    const result = Object.entries(mismatchesByGroup).map(([group, count]) => ({
      group,
      mismatchCount: count
    }));
    
    return result;
  }
  
  module.exports = {findMismatchesByGroup}