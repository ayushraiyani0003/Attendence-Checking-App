// websocket.js
const WebSocket = require('ws');
const { getEmployeesByGroup, getEmployeesAttendanceByMonthAndGroup } = require("../services/attendenceService"); // Import the functions
const { convertMonthToYearMonthFormat } = require("./quickFunction");
const { getRedisAttendanceData } = require('./getRedisAttendenceData');
const { redisMysqlAttendanceCompare } = require('./redisMysqlAttendenceCompare'); // Import the comparison function
const { getLockStatusDataForMonthAndGroup } = require('../services/groupAttendenceLockServices'); // Import the lock status service function


module.exports = {
  initWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
      console.log('A client connected to WebSocket');

      ws.on('message', async (message) => {
        const data = JSON.parse(message);
        console.log(data);
        const userRole = data.user.userRole;
        // month: 'Mar 2025',
        const { year, month } = convertMonthToYearMonthFormat(data.month);
        
        // Fetch employees in the selected group
        const employees = await getEmployeesByGroup(data.group);
        console.log("Employees in group:", employees);

        // Fetch attendance data from MySQL
        const mysqlAttendanceData = await getEmployeesAttendanceByMonthAndGroup(data.group, year, month);
        console.log("MySQL attendance data:", mysqlAttendanceData);

        // Fetch attendance data from Redis
        const redisAttendanceData = await getRedisAttendanceData(year, month, data.group);
        console.log("Redis attendance data:", redisAttendanceData);

        // Compare Redis and MySQL data
        const finalAttendanceData = await redisMysqlAttendanceCompare(employees,redisAttendanceData, mysqlAttendanceData);
        console.log("Final attendance data:", finalAttendanceData.attendance);

        const lockStatusData = await getLockStatusDataForMonthAndGroup(data.group, month, year);
        console.log("Lock status data:", lockStatusData);


        // Send the final attendance data back to the client
        ws.send(JSON.stringify({
            action: 'attendanceData',
            userRole,
            attendance: finalAttendanceData.attendance,
            lockStatus: lockStatusData,  // Include the lock status data in the response
          }));
      });

      ws.on('close', () => {
        console.log('A client disconnected');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  },
};
