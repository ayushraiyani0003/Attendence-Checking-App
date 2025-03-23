const WebSocket = require('ws');
const { Attendance, AttendanceDateLockStatus } = require('../models');
const attendanceService = require('../services/attendanceService');
const lockService = require('../services/lockService');
const { notifyClients } = require('../utils/notification');

let wss;

// Initialize WebSocket server
function initWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    ws.on('message', async (message) => {
      const data = JSON.parse(message);

      // Handle real-time attendance data fetch request
      if (data.action === 'getAttendance') {
        const { group, month } = data;
        const attendanceData = await attendanceService.getAttendanceData(group, month);
        ws.send(JSON.stringify({ action: 'attendanceData', attendance: attendanceData }));
      }

      // Handle real-time attendance edit request
      if (data.action === 'editAttendance') {
        const { employee_id, group, month, date, status } = data;
        const updatedAttendance = await attendanceService.updateAttendance(employee_id, group, month, date, status);

        // Broadcast updated attendance data to all connected clients
        notifyClients(wss, 'attendanceUpdated', {
          employee_id,
          group,
          status: updatedAttendance.status,
          date
        });
      }

      // Handle lock/unlock attendance status request
      if (data.action === 'lockAttendance') {
        const { group, date, status, adminId } = data;
        const lockStatus = await lockService.lockUnlockAttendanceData(group, date, status, adminId);

        // Broadcast lock/unlock status to all connected clients
        notifyClients(wss, 'attendanceLockStatus', {
          group,
          date,
          status: lockStatus.status
        });
      }
    });
  });
}

module.exports = { initWebSocket };
