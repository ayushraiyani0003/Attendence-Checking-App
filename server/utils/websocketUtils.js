const WebSocket = require('ws');
const {
  getEmployeesByGroup,
  getEmployeesAttendanceByMonthAndGroup,
  updateEmployeesDetailsFromRedis,
  getAttendanceSelectedGroupDateMysql
} = require("../services/attendenceService");
const { convertMonthToYearMonthFormat, processAllMetricsData } = require("./quickFunction");
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
const { fetchMetricsForMonthYear } = require('../services/metricsService');

/**
 * Initialize WebSocket server for real-time attendance management
 * @param {Object} server - HTTP/HTTPS server instance
 * @returns {WebSocket.Server} WebSocket server instance
 */
function initWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  // Store client connections with their role, group, and current selected month/year
  const clients = new Map();
  let clientId = 0;

  wss.on('connection', (ws) => {
    // Assign unique ID to each client connection
    const id = ++clientId;
    console.log(`Client ${id} connected to WebSocket`);

    // Store client connection details
    const clientInfo = {
      id,
      socket: ws,
      userRole: null,
      userGroup: null,
      userName: null,
      selectedMonth: null,
      selectedYear: null
    };
    
    clients.set(id, clientInfo);

    /**
     * Broadcasts messages to relevant clients based on role and group
     * @param {Object} broadcastData - Data to broadcast
     * @param {WebSocket} sourceSocket - Original sender socket (to avoid echoing)
     * @param {Array} targetGroups - Specific groups to target (optional)
     * @param {boolean} adminOnly - Whether to broadcast only to admin users
     * @param {boolean} restrictedBroadcast - Whether this is a restricted broadcast for specific groups only
     */
    const broadcastToClients = (broadcastData, sourceSocket = null, targetGroups = null, adminOnly = false, restrictedBroadcast = false) => {
      console.log(`Broadcasting to clients. Action: ${broadcastData.action || broadcastData.type}, Target Groups: ${targetGroups ? targetGroups.join(', ') : 'All'}`);
      
      for (const [clientId, targetClientInfo] of clients.entries()) {
        try {
          // Skip clients without proper initialization
          if (!targetClientInfo.userRole || !targetClientInfo.userGroup) {
            continue;
          }
          
          // Skip the source client to avoid echoing
          if (targetClientInfo.socket === sourceSocket) {
            continue;
          }
          
          // Determine if the client should receive the broadcast
          let shouldReceive = false;
          
          // Admin-only broadcasts
          if (adminOnly && targetClientInfo.userRole === 'admin') {
            shouldReceive = true;
          }
          // Normal broadcasts
          else if (!adminOnly) {
            // Admins should always receive all updates unless it's a restricted broadcast
            if (targetClientInfo.userRole === 'admin' && !restrictedBroadcast) {
              shouldReceive = true;
            } 
            // For users or admins in restricted broadcasts
            else {
              // For targeted broadcasts to specific groups
              if (targetGroups) {
                shouldReceive = targetGroups.includes(targetClientInfo.userGroup);
              } 
              // For general broadcasts
              else if (broadcastData.userReportingGroup) {
                shouldReceive = targetClientInfo.userGroup === broadcastData.userReportingGroup;
              }
            }
          }

          // Send data if conditions are met
          if (shouldReceive) {
            console.log(`Sending broadcast to ${targetClientInfo.userName} (${targetClientInfo.userRole}) in group ${targetClientInfo.userGroup}`);
            targetClientInfo.socket.send(JSON.stringify(broadcastData));
          }
        } catch (error) {
          console.error(`Error broadcasting to client ${clientId}:`, error);
        }
      }
    };

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log(`Received ${data.action} from client ${id}:`, data);

        // Store user info for this connection if provided
        if (data.user) {
          if (data.user.userRole) clientInfo.userRole = data.user.userRole;
          if (data.user.userReportingGroup) clientInfo.userGroup = data.user.userReportingGroup;
          if (data.user.name) clientInfo.userName = data.user.name;
          
          // Store selected month/year if available
          if (data.month) {
            const { year, month } = convertMonthToYearMonthFormat(data.month);
            clientInfo.selectedMonth = month;
            clientInfo.selectedYear = year;
          }
          
          console.log(`Updated client ${id} info:`, {
            role: clientInfo.userRole,
            group: clientInfo.userGroup,
            name: clientInfo.userName,
            month: clientInfo.selectedMonth,
            year: clientInfo.selectedYear
          });
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

          case 'setUserInfo':
            // Update client info when explicitly requested
            clientInfo.userRole = data.user.userRole;
            clientInfo.userGroup = data.user.userReportingGroup;
            clientInfo.userName = data.user.name;
            
            // Update month/year selection if provided
            if (data.month) {
              const { year, month } = convertMonthToYearMonthFormat(data.month);
              clientInfo.selectedMonth = month;
              clientInfo.selectedYear = year;
            }
            
            ws.send(JSON.stringify({
              action: 'userInfoUpdated',
              success: true
            }));
            break;
            
          case 'changeMonthYear':
            // Handle month/year change and fetch new data
            const { year, month } = convertMonthToYearMonthFormat(data.month);
            clientInfo.selectedMonth = month;
            clientInfo.selectedYear = year;
            
            // Fetch updated data for the new month/year
            await handleAttendanceDataRetrieval(ws, {
              ...data,
              month: data.month
            });
            break;

          default:
            console.warn(`Unhandled action from client ${id}:`, data.action);
            ws.send(JSON.stringify({
              error: 'Unknown action',
              action: data.action
            }));
        }
      } catch (error) {
        console.error(`Error processing message from client ${id}:`, error);
        ws.send(JSON.stringify({
          error: 'Failed to process message',
          details: error.message
        }));
      }
    });

    ws.on('close', () => {
      console.log(`Client ${id} disconnected`);
      // Remove the client from the tracked connections
      clients.delete(id);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${id}:`, error);
    });
  });

  return wss;
}

/**
 * Handles attendance data retrieval requests
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} data - Request data
 */
async function handleAttendanceDataRetrieval(ws, data) {
  try {
    const { year, month } = convertMonthToYearMonthFormat(data.month);
    const userRole = data.user.role || data.user.userRole;
    const userGroup = data.user.userReportingGroup;

    console.log(`Fetching attendance data for ${month}/${year}, User: ${data.user.name}, Role: ${userRole}, Group: ${userGroup}`);

    // If user is not admin, only allow access to their own group
    const group = userRole === 'admin' ? (data.group || userGroup) : userGroup;

    // Fetch employees in the selected group
    const employees = await getEmployeesByGroup(group);
    console.log(`Found ${employees.length} employees in group ${group}`);

    // Fetch attendance data from MySQL
    const mysqlAttendanceData = await getEmployeesAttendanceByMonthAndGroup(group, year, month);

    // Fetch attendance data from Redis
    const redisAttendanceData = await getRedisAttendanceData(year, month, group);

    // Get lock status
    const lockStatusData = await getLockStatusDataForMonthAndGroup(group, month, year);

    // Compare Redis and MySQL data
    const finalAttendanceData = await redisMysqlAttendanceCompare(
      employees,
      redisAttendanceData,
      mysqlAttendanceData,
      group,
      lockStatusData
    );

    // Get the metrics attendance and send to the clients
    const metricsAttendanceData = await fetchMetricsForMonthYear(month, year);
    const metricsAttendanceDifference = await processAllMetricsData(metricsAttendanceData, finalAttendanceData);

    // Send the final attendance data back to the client
    ws.send(JSON.stringify({
      action: 'attendanceData',
      userRole,
      userGroup: group,
      month: data.month,
      attendance: finalAttendanceData.attendance,
      lockStatus: lockStatusData,
      metricsAttendanceDifference: metricsAttendanceDifference
    }));
    
    console.log(`Successfully sent attendance data for ${group}, ${month}/${year}`);
  } catch (error) {
    console.error('Error retrieving attendance data:', error);
    ws.send(JSON.stringify({
      action: 'attendanceData',
      error: 'Failed to retrieve attendance data',
      details: error.message
    }));
  }
}

/**
 * Handles attendance update requests
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} data - Request data
 * @param {Function} broadcastToClients - Function to broadcast updates
 */
async function handleAttendanceUpdate(ws, data, broadcastToClients) {
  try {
    // Validate required fields with comprehensive checks
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

    // Normalize user reporting group
    const userReportingGroup = Array.isArray(data.user.userReportingGroup) 
      ? data.user.userReportingGroup[0] 
      : data.user.userReportingGroup;

    // Ensure only admin can update for other groups
    if (data.user.role !== 'admin' && data.reportGroup !== userReportingGroup) {
      throw new Error('Unauthorized to update attendance for this group');
    }

    console.log(`Processing attendance update for employee ${data.employeeId}, field ${data.field}, group ${data.reportGroup}`);

    // Extract month from the editDate (format: YYYY-MM-DD)
    const editDate = new Date(data.editDate);
    const monthYear = `${editDate.getMonth() + 1}/${editDate.getFullYear()}`;

    // Prepare update data
    const updatePayload = {
      employeeId: data.employeeId,
      editDate: data.editDate,
      field: data.field,
      newValue: data.newValue,
      reportGroup: data.reportGroup,
      name: data.user.name || 'Unknown User'
    };

    // Optional: Add oldValue if provided
    if (data.oldValue !== undefined) {
      updatePayload.oldValue = data.oldValue;
    }

    // Call service to update attendance in Redis
    const updateResult = await updateRedisAttendanceData(updatePayload);

    // Determine if the update is from an admin user
    const isAdminUpdate = data.user.role === 'admin';
    
    // Broadcast update to all relevant clients
    // If an admin makes the change, the update will go to all admins and all users in the target group
    // If a regular user makes the change, the update goes to all admins and only users in the same group
    broadcastToClients({
      action: 'attendanceUpdated',
      userReportingGroup: data.reportGroup,
      monthYear: monthYear,
      adminUpdate: isAdminUpdate,
      updateDetails: {
        employeeId: data.employeeId,
        field: data.field,
        newValue: data.newValue,
        editDate: data.editDate,
        updatedBy: data.user.name,
        updaterRole: data.user.role
      }
    }, ws, isAdminUpdate ? null : [data.reportGroup]);

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
    
    console.log(`Successfully updated attendance for employee ${data.employeeId}`);
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

/**
 * Saves Redis attendance data to MySQL
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} data - Request data
 * @param {Function} broadcastToClients - Function to broadcast updates
 */
async function saveDataRedisToMysql(ws, data, broadcastToClients) {
  try {
    if (!data.monthYear) {
      throw new Error('Month/Year is required');
    }
    
    const { year, month } = convertMonthToYearMonthFormat(data.monthYear);
    const userGroup = Array.isArray(data.user.userReportingGroup) 
      ? data.user.userReportingGroup[0] 
      : data.user.userReportingGroup;
      
    console.log(`Saving Redis data to MySQL for ${month}/${year}, group ${userGroup}`);

    // Fetch attendance data from Redis
    const redisAttendanceData = await getRedisAttendanceData(year, month, userGroup);

    // Save data to MySQL
    await updateEmployeesDetailsFromRedis(redisAttendanceData, data.user);

    // Delete Redis data for the specific group
    await deleteRedisGroupKeys(userGroup, year, month);

    // Determine if the operation was performed by an admin
    const isAdminOperation = data.user.role === 'admin';

    // Broadcast updated data to all relevant clients
    // When an admin performs the operation, it should be broadcast to all admins
    // and only the users in the affected group
    broadcastToClients({
      action: 'dataUpdated',
      year,
      month,
      monthYear: data.monthYear,
      userReportingGroup: userGroup,
      adminOperation: isAdminOperation,
      message: 'Data successfully saved and Redis cache cleared',
      updatedBy: data.user.name
    }, ws, [userGroup], false, true);

    // Send success response to the original sender
    ws.send(JSON.stringify({
      action: 'saveDataRedisToMysql',
      status: 'success',
      year,
      month,
      monthYear: data.monthYear
    }));
    
    console.log(`Successfully saved Redis data to MySQL for ${month}/${year}, group ${userGroup}`);
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

/**
 * Toggles lock/unlock status for attendance records
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} data - Request data
 * @param {Function} broadcastToClients - Function to broadcast updates
 */
async function lockUnlockStatusToggle(ws, data, broadcastToClients) {
  try {
    // Ensure only admin can toggle lock status
    if (data.user.role !== 'admin') {
      console.error('Unauthorized attempt to change lock status by:', data.user.role);
      throw new Error('Unauthorized to change lock status');
    }

    // Extract group, date, user, and status from the received data
    const { group, date, user, status } = data;
    console.log(`Processing ${status} request for groups [${group}], date ${date}`);

    // Convert the date from "DD/MM/YYYY" to "YYYY-MM-DD"
    const [day, month, year] = date.split('/').map(part => parseInt(part, 10));
    const formattedDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const monthYear = `${month}/${year}`;

    // Ensure group is an array
    const groupList = Array.isArray(group) ? group : [group];

    if (status === 'unlocked') {
      // Process unlocking
      await processUnlockRequest(ws, formattedDateString, groupList, user, broadcastToClients, monthYear);
    } else {
      // Process locking
      await processLockRequest(ws, date, formattedDateString, groupList, user, broadcastToClients, monthYear);
    }
    
    console.log(`Successfully processed ${status} request for groups [${groupList.join(', ')}], date ${date}`);
  } catch (error) {
    console.error('Error in lockUnlockStatusToggle:', error);

    // Send detailed error message to client
    ws.send(JSON.stringify({
      type: 'lockUnlockStatus',
      error: 'Failed to unlock/lock groups',
      details: error.message
    }));
  }
}

/**
 * Processes unlock request for attendance records
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} formattedDateString - Formatted date string
 * @param {Array} groupList - List of groups
 * @param {Object} user - User information
 * @param {Function} broadcastToClients - Function to broadcast updates
 * @param {string} monthYear - Month/Year string for filtering
 */
async function processUnlockRequest(ws, formattedDateString, groupList, user, broadcastToClients, monthYear) {
  // Check data availability in Redis
  const availableStatus = await checkDataAvailableInRedis(formattedDateString, groupList);

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

  // Store attendance data in Redis
  const redisKeys = storeAttendanceInRedis(mysqlAttendanceData);

  // Change status to unlocked in database
  const result = await setStatusFromDateGroup(groupList, formattedDateString, "unlocked", user);

  // Broadcast lock status change to only relevant admins and the affected groups
  // We use restrictedBroadcast=true to ensure it only goes to the specified groups and admins
  broadcastToClients({
    type: 'lockUnlockStatusChanged',
    action: 'lockStatusUpdate',
    date: formattedDateString,
    monthYear: monthYear,
    groups: unavailableGroups,
    status: 'unlocked',
    changedBy: user.name
  }, ws, unavailableGroups, false, true);

  // Send success response
  ws.send(JSON.stringify({
    type: 'lockUnlockStatus',
    message: 'Successfully processed attendance data',
    date: formattedDateString,
    groups: unavailableGroups,
    redisKeys: redisKeys
  }));
}

/**
 * Processes lock request for attendance records
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} date - Original date string
 * @param {string} formattedDateString - Formatted date string
 * @param {Array} groupList - List of groups
 * @param {Object} user - User information
 * @param {Function} broadcastToClients - Function to broadcast updates
 * @param {string} monthYear - Month/Year string for filtering
 */
async function processLockRequest(ws, date, formattedDateString, groupList, user, broadcastToClients, monthYear) {
  // Save all data in DB for those groups and set the lock status to lock
  const redisAttendanceData = await getSelectedDateRedisData(date, groupList);

  // Save data to MySQL
  await updateEmployeesDetailsFromRedis(redisAttendanceData, user);

  // Delete the data from Redis
  const deleteRedisKey = await deleteRedisGroupKeysForSelectedDate(date, groupList);

  // Change the status to lock in DB
  const result = await setStatusFromDateGroup(groupList, formattedDateString, "locked", user);

  // Broadcast lock status change only to the affected groups and admins
  // We use restrictedBroadcast=true to ensure it only goes to the specified groups and admins
  broadcastToClients({
    type: 'lockUnlockStatusChanged',
    action: 'lockStatusUpdate',
    date: formattedDateString,
    monthYear: monthYear,
    groups: groupList,
    status: 'locked',
    changedBy: user.name
  }, ws, groupList, false, true);
  
  // Send success response
  ws.send(JSON.stringify({
    type: 'lockUnlockStatus',
    message: 'Successfully locked attendance data',
    date: formattedDateString,
    groups: groupList
  }));
}

// Module exports
module.exports = {
  initWebSocket,
  handleAttendanceDataRetrieval,
  handleAttendanceUpdate,
  saveDataRedisToMysql,
  lockUnlockStatusToggle
};