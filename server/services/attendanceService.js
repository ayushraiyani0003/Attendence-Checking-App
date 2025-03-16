const { Attendance, Employee, AttendanceDateLockStatus } = require("../models");
const moment = require("moment");

module.exports = {
  // Add new attendance record
  addAttendance: async (employee_id, attendance_date, shift_type, network_hours, overtime_hours) => {
    try {
      const newAttendance = await Attendance.create({
        employee_id,
        attendance_date,
        shift_type,
        network_hours,
        overtime_hours,
      });
      return newAttendance;
    } catch (error) {
      console.error("Error adding attendance:", error);
      throw new Error("Failed to add attendance");
    }
  },

  // Edit attendance record
  editAttendance: async (attendanceId, network_hours, overtime_hours, shift_type) => {
    try {
      const attendance = await Attendance.findByPk(attendanceId);
      if (!attendance) {
        throw new Error("Attendance record not found");
      }

      attendance.network_hours = network_hours;
      attendance.overtime_hours = overtime_hours;
      attendance.shift_type = shift_type;

      await attendance.save();
      return attendance;
    } catch (error) {
      console.error("Error editing attendance:", error);
      throw new Error("Failed to edit attendance");
    }
  },

  // Get attendance by employee ID
  getAttendanceByEmployee: async (employeeId) => {
    try {
      const attendance = await Attendance.findAll({ where: { employee_id: employeeId } });
      return attendance;
    } catch (error) {
      console.error("Error fetching attendance by employee:", error);
      throw new Error("Failed to fetch attendance");
    }
  },

  // Get attendance by reporting group and month/year
  getAttendanceByReportingGroup: async (groupName, monthYear) => {
    try {
      const monthYearFormat = moment(monthYear, "MMMM-YYYY").format("YYYY-MM");
      const attendance = await Attendance.findAll({
        include: [
          {
            model: Employee,
            where: { reporting_group: groupName },
          },
        ],
        where: {
          attendance_date: {
            [Sequelize.Op.like]: `%${monthYearFormat}%`,
          },
        },
      });
      return attendance;
    } catch (error) {
      console.error("Error fetching attendance by reporting group:", error);
      throw new Error("Failed to fetch attendance by reporting group");
    }
  },

  // Get attendance by date range for employee
  getAttendanceByDateRange: async (employeeId, startDate, endDate) => {
    try {
      const attendance = await Attendance.findAll({
        where: {
          employee_id: employeeId,
          attendance_date: {
            [Sequelize.Op.between]: [startDate, endDate],
          },
        },
      });
      return attendance;
    } catch (error) {
      console.error("Error fetching attendance by date range:", error);
      throw new Error("Failed to fetch attendance by date range");
    }
  },

  // Lock attendance record
  lockAttendance: async (attendanceId, locked_by) => {
    try {
      const attendance = await Attendance.findByPk(attendanceId);
      if (!attendance) {
        throw new Error("Attendance record not found");
      }

      await AttendanceDateLockStatus.create({
        attendance_id: attendanceId,
        status: "locked",
        locked_by,
        attendance_date: attendance.attendance_date,
      });

      return { message: "Attendance locked successfully" };
    } catch (error) {
      console.error("Error locking attendance:", error);
      throw new Error("Failed to lock attendance");
    }
  },

  // Unlock attendance record
  unlockAttendance: async (attendanceId, locked_by) => {
    try {
      const attendance = await Attendance.findByPk(attendanceId);
      if (!attendance) {
        throw new Error("Attendance record not found");
      }

      await AttendanceDateLockStatus.create({
        attendance_id: attendanceId,
        status: "unlocked",
        locked_by,
        attendance_date: attendance.attendance_date,
      });

      return { message: "Attendance unlocked successfully" };
    } catch (error) {
      console.error("Error unlocking attendance:", error);
      throw new Error("Failed to unlock attendance");
    }
  },

  // Get attendance status for reporting group
  getAttendanceStatusForReportingGroup: async (groupName, monthYear) => {
    try {
      const monthYearFormat = moment(monthYear, "MMMM-YYYY").format("YYYY-MM");
      const statusData = await AttendanceDateLockStatus.findAll({
        where: {
          reporting_group_name: groupName,
          attendance_date: {
            [Sequelize.Op.like]: `%${monthYearFormat}%`,
          },
        },
      });
      return statusData;
    } catch (error) {
      console.error("Error fetching attendance status for reporting group:", error);
      throw new Error("Failed to fetch lock/unlock status for reporting group");
    }
  },
};
