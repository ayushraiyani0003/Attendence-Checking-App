const { Attendance, Employee, AttendanceDateLockStatus } = require("../models");
const moment = require("moment");
const { Op } = require("sequelize");

module.exports = {
  // Add new attendance record
  addAttendance: async (req, res) => {
    try {
      const { employee_id, attendance_date, shift_type, network_hours, overtime_hours } = req.body;

      // Validate if all required fields are provided
      if (!employee_id || !attendance_date || !shift_type || network_hours === undefined || overtime_hours === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const newAttendance = await Attendance.create({
        employee_id,
        attendance_date,
        shift_type,
        network_hours,
        overtime_hours,
      });

      res.status(201).json(newAttendance);
    } catch (error) {
      console.error("Error adding attendance:", error);
      res.status(500).json({ message: "Failed to add attendance", error });
    }
  },

  // Edit attendance record
  editAttendance: async (req, res) => {
    try {
      const { attendanceId } = req.params;
      const { network_hours, overtime_hours, shift_type } = req.body;

      // Validate if all fields are provided
      if (network_hours === undefined || overtime_hours === undefined || !shift_type) {
        return res.status(400).json({ message: "Missing required fields to edit attendance" });
      }

      const attendance = await Attendance.findByPk(attendanceId);
      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      attendance.network_hours = network_hours;
      attendance.overtime_hours = overtime_hours;
      attendance.shift_type = shift_type;

      await attendance.save();
      res.status(200).json(attendance);
    } catch (error) {
      console.error("Error editing attendance:", error);
      res.status(500).json({ message: "Failed to edit attendance", error });
    }
  },

  // Get attendance by employee ID
  getAttendanceByEmployee: async (req, res) => {
    try {
      const { employeeId } = req.params;

      const attendance = await Attendance.findAll({ where: { employee_id: employeeId } });
      if (!attendance || attendance.length === 0) {
        return res.status(404).json({ message: "No attendance data found for this employee" });
      }

      res.status(200).json(attendance);
    } catch (error) {
      console.error("Error fetching attendance by employee:", error);
      res.status(500).json({ message: "Failed to fetch attendance", error });
    }
  },

  // Get attendance by reporting group and month/year
  getAttendanceByReportingGroup: async (req, res) => {
    try {
      const { groupName, monthYear } = req.params;

      // Parsing month/year to match attendance_date
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
            [Op.like]: `%${monthYearFormat}%`,
          },
        },
      });

      if (!attendance || attendance.length === 0) {
        return res.status(404).json({ message: "No attendance data found for this reporting group and month/year" });
      }

      res.status(200).json(attendance);
    } catch (error) {
      console.error("Error fetching attendance by reporting group:", error);
      res.status(500).json({ message: "Failed to fetch attendance by reporting group", error });
    }
  },

  // Get attendance by date range for employee
  getAttendanceByDateRange: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;

      // Check if date range is provided
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Please provide both startDate and endDate" });
      }

      const attendance = await Attendance.findAll({
        where: {
          employee_id: employeeId,
          attendance_date: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      if (!attendance || attendance.length === 0) {
        return res.status(404).json({ message: "No attendance data found for this date range" });
      }

      res.status(200).json(attendance);
    } catch (error) {
      console.error("Error fetching attendance by date range:", error);
      res.status(500).json({ message: "Failed to fetch attendance by date range", error });
    }
  },

  // Lock attendance record
  lockAttendance: async (req, res) => {
    try {
      const { attendanceId } = req.params;
      const { locked_by } = req.body;

      // Ensure 'locked_by' field is provided
      if (!locked_by) {
        return res.status(400).json({ message: "Locked by field is required" });
      }

      const attendance = await Attendance.findByPk(attendanceId);
      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      // Create a lock status entry
      await AttendanceDateLockStatus.create({
        attendance_id: attendanceId,
        status: "locked",
        locked_by,
        attendance_date: attendance.attendance_date,
      });

      res.status(200).json({ message: "Attendance locked successfully" });
    } catch (error) {
      console.error("Error locking attendance:", error);
      res.status(500).json({ message: "Failed to lock attendance", error });
    }
  },

  // Unlock attendance record
  unlockAttendance: async (req, res) => {
    try {
      const { attendanceId } = req.params;
      const { locked_by } = req.body;

      // Ensure 'locked_by' field is provided
      if (!locked_by) {
        return res.status(400).json({ message: "Locked by field is required" });
      }

      const attendance = await Attendance.findByPk(attendanceId);
      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      // Create an unlock status entry
      await AttendanceDateLockStatus.create({
        attendance_id: attendanceId,
        status: "unlocked",
        locked_by,
        attendance_date: attendance.attendance_date,
      });

      res.status(200).json({ message: "Attendance unlocked successfully" });
    } catch (error) {
      console.error("Error unlocking attendance:", error);
      res.status(500).json({ message: "Failed to unlock attendance", error });
    }
  },

  // Get attendance data and lock status for each reporting group per month
  getAttendanceStatusForReportingGroup: async (req, res) => {
    try {
      const { groupName, monthYear } = req.params;

      const monthYearFormat = moment(monthYear, "MMMM-YYYY").format("YYYY-MM");
      const statusData = await AttendanceDateLockStatus.findAll({
        where: {
          reporting_group_name: groupName,
          attendance_date: {
            [Op.like]: `%${monthYearFormat}%`,
          },
        },
      });

      if (!statusData || statusData.length === 0) {
        return res.status(404).json({ message: "No lock/unlock status data found for this reporting group and month/year" });
      }

      res.status(200).json(statusData);
    } catch (error) {
      console.error("Error fetching attendance lock status for reporting group:", error);
      res.status(500).json({ message: "Failed to fetch lock/unlock status", error });
    }
  },
};
