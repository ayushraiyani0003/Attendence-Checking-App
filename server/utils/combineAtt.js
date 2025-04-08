/**
 * Combines attendance data from MySQL and Redis, prioritizing Redis data
 * @param {Array} attendanceData - MySQL attendance data
 * @param {Array} redisData - Redis attendance data
 * @returns {Array} Combined attendance data with one entry per employee per date
 */
function combineAttendanceData(attendanceData, redisData) {
    // Create a map to store the final combined data
    // Using employee_id + date as the key to ensure uniqueness
    const combinedDataMap = new Map();
    
    // First, add all MySQL data to the map
    for (const record of attendanceData) {
      const key = `${record.employee_id}_${record.attendance_date}`;
      combinedDataMap.set(key, record);
    }
    
    // Then process Redis data, which will override MySQL data if same employee and date
    for (const redisRecord of redisData) {
      try {
        // Parse the JSON string in the data field
        const parsedData = JSON.parse(redisRecord.data);
        
        // Process each record in the parsed data array
        for (const record of parsedData) {
          const key = `${record.employee_id}_${record.attendance_date}`;
          
          // Check if we already have this record from MySQL
          const existingRecord = combinedDataMap.get(key);
          
          if (existingRecord) {
            // Create a new record that merges the Redis data with any additional fields from MySQL
            const mergedRecord = {
              // Start with existing record to keep all fields
              ...existingRecord,
              // Override with Redis data
              employee_id: record.employee_id,
              attendance_date: record.attendance_date,
              shift_type: record.shift_type,
              network_hours: record.network_hours,
              overtime_hours: record.overtime_hours,
              comment: record.comment,
              // Keep the reporting_group from Redis record
              reporting_group: redisRecord.group
            };
            
            // Update the map with the merged record
            combinedDataMap.set(key, mergedRecord);
          } else {
            // If the record doesn't exist in MySQL, create a new one from Redis data
            const newRecord = {
              // Add attendance_id as null or generate a temporary one if needed
              attendance_id: null,
              // Redis data
              employee_id: record.employee_id,
              attendance_date: record.attendance_date,
              shift_type: record.shift_type,
              network_hours: record.network_hours,
              overtime_hours: record.overtime_hours,
              comment: record.comment,
              // Add createdAt and updatedAt as current time or null
              createdAt: new Date(),
              updatedAt: new Date(),
              // Add the reporting group from Redis
              reporting_group: redisRecord.group
            };
            
            // Add to the map
            combinedDataMap.set(key, newRecord);
          }
        }
      } catch (error) {
        console.error(`Error parsing Redis data for group ${redisRecord.group}, date ${redisRecord.date}:`, error);
        // Continue with the next record if there's an error
      }
    }
    
    // Convert the map values to an array for the final result
    return Array.from(combinedDataMap.values());
  }
  module.exports = {combineAttendanceData};
