const { Attendance } = require('../models');

async function getAttendanceData(group, month) {
  return Attendance.findAll({
    where: { reporting_group: group, attendance_date: month },
  });
}

async function updateAttendance(employee_id, group, month, date, status) {
  const attendance = await Attendance.update(
    { status },
    { where: { employee_id, reporting_group: group, attendance_date: date } }
  );
  return attendance;
}

module.exports = { getAttendanceData, updateAttendance };
