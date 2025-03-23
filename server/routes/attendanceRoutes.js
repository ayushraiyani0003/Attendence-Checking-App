const express = require('express');
const { getAttendance, editAttendance } = require('../controllers/attendanceController');
const { authenticateJWT } = require('../middlewares/authMiddleware');
const router = express.Router();

// Protected route to get attendance
router.get('/attendance', authenticateJWT, getAttendance);

// Protected route to edit attendance
router.post('/attendance/edit', authenticateJWT, editAttendance);

module.exports = router;
