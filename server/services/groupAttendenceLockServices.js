const { AttendanceDateLockStatus } = require('../models'); // Assuming you have the models directory
const { Op, sequelize  } = require('sequelize');
const moment = require('moment');

// Function to get lock status data based on month and group
async function getLockStatusDataForMonthAndGroup(groups, month, year) {
    
  try {
    // Fix the startDate format (e.g., 'Mar 2025' -> '2025-03-01')
    const startDate = moment(`${month}-01 ${year}`, 'M-DD YYYY').format('YYYY-MM-DD');
    const endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');
    
    // Generate all the dates in the selected month
    const dateArray = [];
    let currentDate = moment(startDate);

    // Generate all the dates in the selected month
    while (currentDate.isBefore(moment(endDate).add(1, 'days'), 'day')) {
      dateArray.push(currentDate.format('YYYY-MM-DD'));  // Add formatted date to the array
      currentDate.add(1, 'days'); // Move to the next day
    }

    // Fetch all lock statuses for the generated dates in the selected month
    const lockStatusData = [];
    for (let groupName of groups) {
      const lockStatusForGroup = await AttendanceDateLockStatus.findAll({
        where: {
          attendance_date: {
            [Op.in]: dateArray, // For all dates in the selected month
          },
          reporting_group_name: groupName, // Only for the selected group
        },
      });

      lockStatusForGroup.forEach((status) => {
        lockStatusData.push({
          date: status.attendance_date,  // Date for the status
          reporting_group: status.reporting_group_name,  // Group name
          status: status.status || 'unlocked',  // Default to 'unlocked'
        });
      });
    }

    // Return lock status data
    return lockStatusData;

  } catch (error) {
    console.error('Error fetching lock status data:', error);
    throw error;
  }
}

async function setStatusFromDateGroup(groups, date, status, user) {
  try {
    console.log(date);
    
    // Ensure the date is in the correct format
    const formattedDate = moment(date).format('YYYY-MM-DD');
    
    // Log to verify the values being passed
    console.log('Setting status with values:');
    console.log('Formatted Date:', formattedDate);
    console.log('Groups:', groups);
    console.log('Status:', status);
    console.log('User:', user ? user.username : 'undefined');
    
    // Ensure groups is an array
    const groupsArray = Array.isArray(groups) ? groups : [groups];
    
    if (groupsArray.length === 0) {
      console.error('No groups provided for status update');
      return {
        success: false,
        updatedRows: 0,
        totalRecordsProcessed: 0,
        error: 'No groups provided'
      };
    }
    
    // Check if records exist first
    const existingRecords = await AttendanceDateLockStatus.findAll({
      where: {
        attendance_date: formattedDate,
        reporting_group_name: {
          [Op.in]: groupsArray
        }
      }
    });
    
    console.log(`Found ${existingRecords.length} existing records for date: ${formattedDate} and groups: ${groupsArray.join(', ')}`);
    
    // Track which records need to be created
    const existingGroups = existingRecords.map(record => record.reporting_group_name);
    const groupsToCreate = groupsArray.filter(group => !existingGroups.includes(group));
    
    // If there are groups that need records created
    if (groupsToCreate.length > 0) {
      console.log(`Creating new records for groups: ${groupsToCreate.join(', ')}`);
      
      const newRecords = groupsToCreate.map(group => ({
        attendance_date: formattedDate,
        reporting_group_name: group,
        status: status,
        locked_by: user ? user.username : null
      }));
      
      try {
        // Create new records
        const createdRecords = await AttendanceDateLockStatus.bulkCreate(newRecords);
        console.log(`Created ${createdRecords.length} new status records`);
      } catch (createError) {
        console.error('Error creating records:', createError);
        // Continue execution even if creation fails
      }
    }
    
    // Now update existing records
    if (existingGroups.length > 0) {
      console.log(`Updating existing records for groups: ${existingGroups.join(', ')}`);
      
      const [updatedRows] = await AttendanceDateLockStatus.update(
        {
          status: status,
          locked_by: user ? user.username : null
        },
        {
          where: {
            attendance_date: formattedDate,
            reporting_group_name: {
              [Op.in]: existingGroups
            }
          }
        }
      );
      
      console.log(`Updated ${updatedRows} existing records`);
    }
    
    // Double-check that all records are now as expected
    const finalRecords = await AttendanceDateLockStatus.findAll({
      where: {
        attendance_date: formattedDate,
        reporting_group_name: {
          [Op.in]: groupsArray
        }
      }
    });
    
    console.log(`Final check: ${finalRecords.length} records found with status '${status}'`);
    
    return {
      success: true,
      updatedRows: existingGroups.length,
      createdRows: groupsToCreate.length,
      totalRecordsProcessed: groupsArray.length
    };
  } catch (error) {
    console.error('Error setting status for date and group:', error);
    console.error('Full error stack:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}



module.exports = {
  getLockStatusDataForMonthAndGroup,setStatusFromDateGroup
};
