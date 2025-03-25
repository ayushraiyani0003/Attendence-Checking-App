const redisClient = require('../config/redisConfig');

// Function to get all attendance for a given month and year
async function getRedisAttendanceData(year, month, groups) {
    const startDate = new Date(year, month - 1, 1); // First date of the month
    const endDate = new Date(year, month, 0); // Last date of the month
    const result = [];

    // Loop through all the groups
    for (const group of groups) {
        // Loop through all the days of the month
        for (let day = startDate.getDate(); day <= endDate.getDate(); day++) {
            const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const key = `attendance:${group}:${date}`;

            // Log the key for debugging
            console.log(key);

            try {
                // Await the Redis GET operation
                const data = await redisClient.get(key); // Fetch the data from Redis
                
                if (data) {
                    result.push({ group, date, data }); // Add group, date, and data to the result if it exists
                }
            } catch (err) {
                console.error(`Error fetching data for ${group} on ${date}:`, err);
            }
        }
    }

    return result;
}
// Function to update attendance data in Redis
async function updateRedisAttendanceData(updateData) {
    try {
      // Validate input data
      if (!updateData || !updateData.employeeId || !updateData.editDate) {
        throw new Error('Missing required fields for Redis update');
      }
  
      // Format the date to match Redis key format (YYYY-MM-DD)
      const formattedDate = formatDate(updateData.editDate);
      
      // Construct the Redis key
      const key = `attendance:${updateData.reportGroup}:${formattedDate}`;
      
      // Retrieve existing data for the key
      const existingData = await redisClient.get(key);
      
      if (!existingData) {
        throw new Error(`No existing data found for key: ${key}`);
      }
  
      let attendanceRecords;
      try {
        // Parse existing data 
        attendanceRecords = JSON.parse(existingData);
      } catch (parseError) {
        throw new Error('Error parsing existing Redis data');
      }
  
      // Find the specific employee record
      const employeeRecordIndex = attendanceRecords.findIndex(
        record => record.employee_id === updateData.employeeId
      );
  
      if (employeeRecordIndex === -1) {
        throw new Error(`No record found for employee ID ${updateData.employeeId}`);
      }
  
      // Map field names
      const fieldMapping = {
        'netHR': 'network_hours',
        'otHR': 'overtime_hours'
      };
  
      // Get the mapped field name
      const mappedField = fieldMapping[updateData.field] || updateData.field;
  
      // Update the specific field
      attendanceRecords[employeeRecordIndex][mappedField] = parseFloat(updateData.newValue);
  
      // Add metadata
      attendanceRecords[employeeRecordIndex].lastUpdatedBy = updateData.name;
      attendanceRecords[employeeRecordIndex].lastUpdatedAt = new Date().toISOString();
  
      // Store the updated record back in Redis
      await redisClient.set(key, JSON.stringify(attendanceRecords));
  
      console.log(`Updated Redis key ${key} for employee ${updateData.employeeId}`);
  
      return {
        success: true,
        key: key,
        updatedRecord: attendanceRecords[employeeRecordIndex]
      };
    } catch (error) {
      console.error('Error updating Redis attendance data:', error);
      throw error;
    }
  }

  // delete redis data for freeup the memory base on group only "because on group data submit all data is submit" 
  async function deleteRedisGroupKeys(groups, year, month) {
    try {
        // Ensure groups is an array
        const groupList = Array.isArray(groups) ? groups : [groups];

        // Create date range for the specified month and year
        const startDate = new Date(year, month - 1, 1); // First date of the month
        const endDate = new Date(year, month, 0); // Last date of the month

        // Array to store deletion promises for all groups
        const deletionPromises = [];

        // Loop through all groups
        for (const group of groupList) {
            // Loop through all the days of the month
            for (let day = startDate.getDate(); day <= endDate.getDate(); day++) {
                // Format the date to match Redis key format (YYYY-MM-DD)
                const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const key = `attendance:${group}:${date}`;

                // Add deletion promise to array
                deletionPromises.push(
                    redisClient.del(key)
                        .then(() => ({ key, status: 'success' }))
                        .catch(err => ({ key, status: 'failed', error: err }))
                );
            }
        }

        // Wait for all deletion operations to complete
        const deletionResults = await Promise.allSettled(deletionPromises);

        // Organize results by group
        const groupResults = {};
        groupList.forEach(group => {
            groupResults[group] = {
                successfulDeletions: 0,
                failedDeletions: 0,
                failedKeys: []
            };
        });

        // Process results
        deletionResults.forEach(result => {
            if (result.status === 'fulfilled') {
                const { key, status } = result.value;
                const group = key.split(':')[1];
                
                if (status === 'success') {
                    groupResults[group].successfulDeletions++;
                } else {
                    groupResults[group].failedDeletions++;
                    groupResults[group].failedKeys.push(key);
                }
            }
        });

        return {
            success: true,
            year,
            month,
            groupResults
        };
    } catch (error) {
        console.error('Error in deleteRedisGroupKeys:', error);
        throw error;
    }
}

  // Helper function to format date
  function formatDate(dateString) {
    // Handle different date formats
    const parts = dateString.split('/');
    if (parts.length !== 3) {
      throw new Error('Invalid date format. Use DD/MM/YYYY');
    }
  
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
  
    return `${year}-${month}-${day}`;
  }

module.exports = { getRedisAttendanceData,updateRedisAttendanceData,deleteRedisGroupKeys  };
