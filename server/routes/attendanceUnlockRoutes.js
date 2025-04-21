const express = require('express');
const router = express.Router();
const attendanceUnlockController = require('../controllers/AttendanceUnlockRequestController');
const { authenticateJWT, isAdmin } = require('../middlewares/authMiddleware');

// Route to create a new attendance unlock request (requires authentication, any logged-in user)
router.post('/create', 
  authenticateJWT, 
  attendanceUnlockController.createRequest.bind(attendanceUnlockController)
);

// Route to update a request status (requires admin role)
router.put('/update-status/:requestId', 
  authenticateJWT, 
  isAdmin, 
  attendanceUnlockController.updateRequestStatus.bind(attendanceUnlockController)
);

// Route to get filtered requests
// - If admin, can see all requests
// - If regular user, can only see their own requests (logic handled in controller)
router.get('/filter', 
  authenticateJWT, 
  attendanceUnlockController.getFilteredRequests.bind(attendanceUnlockController)
);

module.exports = router;