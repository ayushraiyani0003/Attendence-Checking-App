const { AttendanceDateLockStatus } = require('../models'); // Assuming you have the models directory
const { Op } = require('sequelize');
const moment = require('moment');

// Function to get lock status data based on month and group
async function getLockStatusDataForMonthAndGroup(groups, month, year) {

    console.log("Month: " + month);
    
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

// Function to set status from date and group
async function setStatusFromDateGroup(groups, date, status, user) {
  try {
    // Ensure the date is in the correct format
    const formattedDate = moment(date).format('YYYY-MM-DD');

    // Log to verify the values being passed
    console.log('Formatted Date:', formattedDate);
    console.log('Groups:', groups);

    // Bulk update for all specified groups and the specific date
    const [updatedRows] = await AttendanceDateLockStatus.update(
      { 
        status: status,      // New status to set
        locked_by: user.username  // Locking the record by the user
      },
      {
        where: {
          attendance_date: formattedDate,
          reporting_group_name: {
            [Op.in]: groups // Ensure the values match correctly
          }
        }
      }
    );

    // If no rows were updated, log this or handle it as needed
    if (updatedRows === 0) {
      console.log('No records updated, no new records created.');
    }

    return {
      updatedRows: updatedRows,
      totalRecordsProcessed: groups.length
    };
  } catch (error) {
    console.error('Error setting status for date and group:', error);
    throw error;
  }
}




module.exports = {
  getLockStatusDataForMonthAndGroup,setStatusFromDateGroup
};
