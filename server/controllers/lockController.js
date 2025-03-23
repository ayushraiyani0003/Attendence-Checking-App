const lockService = require('../services/lockService');
const { notifyClients } = require('../utils/notification');

async function lockAttendance(req, res) {
  const { group, date, status, adminId } = req.body;
  const lockStatus = await lockService.lockUnlockAttendanceData(group, date, status, adminId);

  // Broadcast the lock/unlock status to all connected clients
  notifyClients(req.app.get('wss'), 'attendanceLockStatus', {
    group,
    date,
    status: lockStatus.status
  });

  res.json({ message: 'Attendance lock status updated', lockStatus });
}

module.exports = { lockAttendance };
