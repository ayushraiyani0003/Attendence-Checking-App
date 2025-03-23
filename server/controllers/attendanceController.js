const attendanceService = require('../services/attendanceService');
const { notifyClients } = require('../utils/notification');

async function getAttendance(req, res) {
  const { group, month } = req.query;
  const attendanceData = await attendanceService.getAttendanceData(group, month);
  res.json({ attendance: attendanceData });
}

async function editAttendance(req, res) {
  const { employee_id, group, month, date, status } = req.body;
  const updatedAttendance = await attendanceService.updateAttendance(employee_id, group, month, date, status);
  
  // Send updated attendance to all connected clients
  notifyClients(req.app.get('wss'), 'attendanceUpdated', {
    employee_id,
    group,
    status: updatedAttendance.status,
    date
  });
  
  res.json({ message: 'Attendance updated successfully', updatedAttendance });
}

module.exports = { getAttendance, editAttendance };
