const WebSocket = require('ws');
const {
  getEmployeesByGroup,
  getEmployeesAttendanceByMonthAndGroup,
  updateEmployeesDetailsFromRedis,
  getAttendanceSelectedGroupDateMysql
} = require("../services/attendenceService");
const { convertMonthToYearMonthFormat } = require("./quickFunction");
const { 
  getRedisAttendanceData, 
  updateRedisAttendanceData, 
  deleteRedisGroupKeys, 
  checkDataAvailableInRedis,
  storeAttendanceInRedis, 
  getSelectedDateRedisData,
  deleteRedisGroupKeysForSelectedDate
} = require('./getRedisAttendenceData');
const { redisMysqlAttendanceCompare } = require('./redisMysqlAttendenceCompare');
const { getLockStatusDataForMonthAndGroup, setStatusFromDateGroup } = require('../services/groupAttendenceLockServices');

function initWebSocket(server) {
  const wss = new WebSocket.Server({ server });
  
  // Store client connections with their role and group
  const clients = new Set();

  wss.on('connection', (ws) => {
    ws.server = wss;
    console.log('A client connected to WebSocket');

    // Store client connection details
    const clientInfo = {
      socket: ws,
      userRole: null,
      userGroup: null
    };
    clients.add(clientInfo);

    // Broadcast function to send updates to relevant clients
    const broadcastToClients = (broadcastData, sourceSocket = null) => {
      clients.forEach((clientInfo) => {
        const client = clientInfo.socket;
        
        // Only send to open sockets and clients with matching group or with admin/manager role
        if (
          client.readyState === WebSocket.OPEN && 
          (
            clientInfo.userRole === 'admin' || 
            clientInfo.userRole === 'manager' || 
            clientInfo.userGroup === broadcastData.userReportingGroup
          )
        ) {
          // Skip sending to the source socket to prevent duplicate messages
          if (client !== sourceSocket) {
            try {
              client.send(JSON.stringify(broadcastData));
            } catch (error) {
              console.error('Error broadcasting to client:', error);
            }
          }
        }
      });
    };

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Received data:', data);

        // Store user role and group for this connection
        if (data.user && data.user.userRole && data.user.userReportingGroup) {
          clientInfo.userRole = data.user.userRole;
          clientInfo.userGroup = data.user.userReportingGroup;
        }

        // Handle different actions dynamically
        switch (data.action) {
          case 'getAttendance':
            await handleAttendanceDataRetrieval(ws, data);
            break;

          case 'updateAttendance':
            await handleAttendanceUpdate(ws, data, broadcastToClients);
            break;

          case 'saveDataRedisToMysql':
            await saveDataRedisToMysql(ws, data, broadcastToClients);
            break;

          case 'lockUnlockStatusToggle':
            await lockUnlockStatusToggle(ws, data, broadcastToClients);
            break;

          // Add more cases for different actions
          default:
            console.warn('Unhandled action:', data.action);
            ws.send(JSON.stringify({
              error: 'Unknown action',
              action: data.action
            }));
        }
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(JSON.stringify({
          error: 'Failed to process message',
          details: error.message
        }));
      }
    });

    ws.on('close', () => {
      console.log('A client disconnected');
      // Remove the client from the tracked connections
      clients.delete(clientInfo);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}

// Function to handle attendance data retrieval
async function handleAttendanceDataRetrieval(ws, data) {
  try {
    const { year, month } = convertMonthToYearMonthFormat(data.month);
    const userRole = data.user.userRole;

    // Fetch employees in the selected group
    const employees = await getEmployeesByGroup(data.group);

    // Fetch attendance data from MySQL
    const mysqlAttendanceData = await getEmployeesAttendanceByMonthAndGroup(data.group, year, month);

    // Fetch attendance data from Redis
    const redisAttendanceData = await getRedisAttendanceData(year, month, data.group);

    // Get lock status
    const lockStatusData = await getLockStatusDataForMonthAndGroup(data.group, month, year);

    // Compare Redis and MySQL data
    const finalAttendanceData = await redisMysqlAttendanceCompare(
      employees,
      redisAttendanceData,
      mysqlAttendanceData,
      data.group,
      lockStatusData
    );

    // Send the final attendance data back to the client
    ws.send(JSON.stringify({
      action: 'attendanceData',
      userRole,
      attendance: finalAttendanceData.attendance,
      lockStatus: lockStatusData
    }));
  } catch (error) {
    console.error('Error retrieving attendance data:', error);
    ws.send(JSON.stringify({
      action: 'attendanceData',
      error: 'Failed to retrieve attendance data',
      details: error.message
    }));
  }
}

// Function to handle attendance update
async function handleAttendanceUpdate(ws, data, broadcastToClients) {
  try {
    // Validate required fields with more comprehensive checks
    const requiredFields = [
      'employeeId',
      'editDate',
      'field',
      'newValue',
      'reportGroup'
    ];

    // Check for missing fields
    const missingFields = requiredFields.filter(field =>
      data[field] === undefined || data[field] === null
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Prepare update data
    const updatePayload = {
      employeeId: data.employeeId,
      editDate: data.editDate,
      field: data.field,
      newValue: data.newValue,
      reportGroup: data.reportGroup,
      name: data.name || 'Unknown User'
    };

    // Optional: Add oldValue if provided
    if (data.oldValue !== undefined) {
      updatePayload.oldValue = data.oldValue;
    }

    // Call service to update attendance in Redis
    const updateResult = await updateRedisAttendanceData(updatePayload);

    // Broadcast update to all relevant clients
    broadcastToClients({
      action: 'attendanceUpdated',
      userReportingGroup: data.reportGroup,
      updateDetails: {
        employeeId: data.employeeId,
        field: data.field,
        newValue: data.newValue,
        updatedBy: data.name
      }
    }, ws);

    // Send success response to the original sender
    ws.send(JSON.stringify({
      action: 'attendanceUpdateResult',
      success: true,
      message: 'Attendance updated successfully',
      updateDetails: {
        employeeId: data.employeeId,
        field: data.field,
        newValue: data.newValue,
        group: data.reportGroup
      }
    }));
  } catch (error) {
    // More detailed error logging
    console.error('Attendance Update Error:', {
      employeeId: data.employeeId,
      field: data.field,
      error: error.message,
      fullError: error
    });

    // Send error response
    ws.send(JSON.stringify({
      action: 'attendanceUpdateResult',
      success: false,
      error: 'Failed to update attendance',
      details: error.message,
      employeeId: data.employeeId,
      field: data.field
    }));
  }
}

async function saveDataRedisToMysql(ws, data, broadcastToClients) {
  const { year, month } = convertMonthToYearMonthFormat(data.monthYear);

  try {
    // Fetch attendance data from Redis
    const redisAttendanceData = await getRedisAttendanceData(year, month, data.user.userReportingGroup);
    console.log(redisAttendanceData);

    // Save data to MySQL
    await updateEmployeesDetailsFromRedis(redisAttendanceData, data.user);

    // Delete Redis data for the specific group
    deleteRedisGroupKeys(data.user.userReportingGroup, year, month);

    // Broadcast updated data to all relevant clients
    broadcastToClients({
      action: 'dataUpdated',
      year,
      month,
      userReportingGroup: data.user.userReportingGroup,
      message: 'Data successfully saved and Redis cache cleared'
    }, ws);

    // Send success response to the original sender
    ws.send(JSON.stringify({
      action: 'saveDataRedisToMysql',
      status: 'success',
      year,
      month
    }));
  } catch (error) {
    console.error('Error in saveDataRedisToMysql:', error);

    // Send error response to the original sender
    ws.send(JSON.stringify({
      action: 'saveDataRedisToMysql',
      status: 'error',
      error: error.message
    }));
  }
}

async function lockUnlockStatusToggle(ws, data, broadcastToClients) {
  try {
    // Extract group, date, user, and status from the received data
    const { group, date, user, status } = data;

    // Convert the date from "24/3/2025" to "2025-03-25"
    const [day, month, year] = date.split('/').map(part => parseInt(part, 10));
    const formattedDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    console.log(formattedDateString); // Outputs: "2025-03-24"

    // Ensure group is an array
    const groupList = Array.isArray(group) ? group : [group];
    
    if (status === 'unlocked') {
      // Check data availability in Redis
      const availableStatus = await checkDataAvailableInRedis(formattedDateString, groupList);

      // Check if all groups are already available
      const allGroupsAlreadyAvailable = Object.values(availableStatus.groups).every(
        groupStatus => groupStatus.available
      );

      if (allGroupsAlreadyAvailable) {
        ws.send(JSON.stringify({
          type: 'lockUnlockStatus',
          message: 'All groups are already unlocked',
          date: formattedDateString,
          groups: groupList
        }));
        return;
      }

      // Identify groups that are not available in Redis
      const unavailableGroups = groupList.filter(
        groupName => !availableStatus.groups[groupName]?.available
      );

      if (unavailableGroups.length === 0) {
        ws.send(JSON.stringify({
          type: 'lockUnlockStatus',
          message: 'No groups need unlocking',
          date: formattedDateString,
          groups: groupList
        }));
        return;
      }

      // Fetch attendance data for unavailable groups
      const mysqlAttendanceData = await getAttendanceSelectedGroupDateMysql(
        unavailableGroups,
        formattedDateString
      );

      // Validate mysqlAttendanceData before processing
      if (!mysqlAttendanceData || !mysqlAttendanceData.records || mysqlAttendanceData.records.length === 0) {
        ws.send(JSON.stringify({
          type: 'lockUnlockStatus',
          message: 'No attendance data found',
          date: formattedDateString,
          groups: unavailableGroups
        }));
        return;
      }

      // Make Redis keys for the attendance data
      const redisKeys = storeAttendanceInRedis(mysqlAttendanceData);
      console.log('Generated Redis Keys:', mysqlAttendanceData);

      // Validate redisKeys before further processing
      if (!redisKeys || redisKeys.length === 0) {
        ws.send(JSON.stringify({
          type: 'lockUnlockStatus',
          error: 'Failed to generate Redis keys',
          date: formattedDateString,
          groups: unavailableGroups
        }));
        return;
      }

      const result = await setStatusFromDateGroup(group, formattedDateString, "unlocked", user);
      
      // Broadcast lock status change
      broadcastToClients({
        type: 'lockUnlockStatusChanged',
        date: formattedDateString,
        groups: unavailableGroups,
        status: 'unlocked',
        changedBy: user.name
      }, ws);

      // Send success response
      ws.send(JSON.stringify({
        type: 'lockUnlockStatus',
        message: 'Successfully processed attendance data',
        date: formattedDateString,
        groups: unavailableGroups,
        redisKeys: redisKeys
      }));
    } else {
      // save all data in db for those group and set the lock status to lock
      const redisAttendanceData = await getSelectedDateRedisData(date, group);
      console.log(redisAttendanceData);

      // Save data to MySQL
      await updateEmployeesDetailsFromRedis(redisAttendanceData, data.user);

      // delete the data from redis
      const deleteRedisKey = await deleteRedisGroupKeysForSelectedDate(date, group);
      console.log(deleteRedisKey);

      // change the status to lock in db 
      const result = await setStatusFromDateGroup(group, formattedDateString, "locked", user);

      // Broadcast lock status change
      broadcastToClients({
        type: 'lockUnlockStatusChanged',
        date: formattedDateString,
        groups: groupList,
        status: 'locked',
        changedBy: user.name
      }, ws);
    }
  } catch (error) {
    console.error('Error in lockUnlockStatusToggle:', error);
    
    // Send detailed error message to client
    ws.send(JSON.stringify({
      type: 'lockUnlockStatus',
      error: 'Failed to unlock/lock groups',
      details: error.message,
      stack: error.stack // Optional: only include in development
    }));
  }
}

// Correct module exports
module.exports = {
  initWebSocket,
  handleAttendanceUpdate,
  saveDataRedisToMysql,
  lockUnlockStatusToggle
};