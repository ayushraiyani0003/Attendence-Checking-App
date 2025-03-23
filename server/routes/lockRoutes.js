const express = require('express');
const { lockAttendance } = require('../controllers/lockController');
const { authenticateJWT, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// Protected route for admin to lock/unlock attendance
router.post('/attendance/lock', authenticateJWT, isAdmin, lockAttendance);

module.exports = router;
