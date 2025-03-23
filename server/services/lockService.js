const { AttendanceDateLockStatus } = require('../models');

async function lockUnlockAttendanceData(group, date, status, adminId) {
  const lockStatus = await AttendanceDateLockStatus.create({
    reporting_group_name: group,
    attendance_date: date,
    status,
    locked_by: adminId
  });
  return lockStatus;
}

module.exports = { lockUnlockAttendanceData };
