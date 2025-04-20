const express = require('express');
const router = express.Router();
const attendanceLogsController = require('../controllers/attendanceLogsController');
const { authenticateJWT, isAdmin } = require('../middlewares/authMiddleware');

/**
 * @route GET /api/attendance-logs
 * @desc Get attendance logs by specific date
 * @access Private (Admin only)
 */
router.get(
  '/', 
  [authenticateJWT, isAdmin], 
  attendanceLogsController.getAttendanceLogs.bind(attendanceLogsController)
);

module.exports = router;