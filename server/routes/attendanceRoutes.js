const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { authenticateJWT, isAdmin, canEditAttendance } = require("../middlewares/adminUserMiddleware"); // Import the new middlewares

// Add a new attendance record (can be used by HR/Admin)
router.post("/add", authenticateJWT, isAdmin, attendanceController.addAttendance);

// Edit attendance record (HR/Admin or authorized users can edit)
router.put("/edit/:attendanceId", authenticateJWT, canEditAttendance, attendanceController.editAttendance);

// Select attendance by employee ID (all users can access their own attendance)
router.get("/employee/:employeeId", authenticateJWT, attendanceController.getAttendanceByEmployee);

// Select attendance by reporting group and month/year (to get group-wise data)
router.get("/reporting-group/:groupName/month/:monthYear", authenticateJWT, attendanceController.getAttendanceByReportingGroup);

// Select attendance by date range for employee (filter by specific date range)
router.get("/employee/:employeeId/date-range", authenticateJWT, attendanceController.getAttendanceByDateRange);

// Select attendance by reporting group (general query for all employees in a reporting group)
router.get("/reporting-group/:groupName", authenticateJWT, attendanceController.getAttendanceByReportingGroup);

// Lock attendance (HR/Admin can lock attendance data for specific dates)
router.put("/lock/:attendanceId", authenticateJWT, isAdmin, attendanceController.lockAttendance);

// Unlock attendance (HR/Admin can unlock attendance data for specific dates)
router.put("/unlock/:attendanceId", authenticateJWT, isAdmin, attendanceController.unlockAttendance);

// Endpoint to get attendance data and lock status for each reporting group per month
router.get("/reporting-group-status/:groupName/month/:monthYear", authenticateJWT, attendanceController.getAttendanceStatusForReportingGroup);

module.exports = router;
