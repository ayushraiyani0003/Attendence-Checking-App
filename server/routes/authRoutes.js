// routes/authRoutes.js
const express = require('express');
const { userLogin } = require('../controllers/authController.js');
const router = express.Router();

// Handle user login
router.post('/login', userLogin);

// Handle user logout
router.post('/logout', (req, res) => {
  res.clearCookie('authToken');  // Clear the token cookie
  res.json({ message: 'Logged out successfully' });
});


module.exports = router;
