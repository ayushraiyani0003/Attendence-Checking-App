const express = require('express');
const { userLogin, validateToken } = require('../controllers/authController.js');
const { authenticateJWT } = require('../middlewares/authMiddleware');  // Import authentication middleware
const router = express.Router();

// Handle user login
router.post('/login', userLogin);

// Handle user logout
router.post('/logout', (req, res) => {
  res.clearCookie('authToken');  // Clear the token cookie
  res.json({ message: 'Logged out successfully' });
});

// Token validation route
router.get('/validate-token', authenticateJWT, validateToken);  // Protect the route with JWT authentication middleware

module.exports = router;
