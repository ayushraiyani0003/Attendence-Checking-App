const express = require('express');
const router = express.Router();
const { 
  userLogin, 
  validateToken, 
  userLogout, 
  pingSession, 
  validateSession 
} = require('../controllers/authController');
const { authenticateJWT } = require('../middlewares/authMiddleware');

// Auth routes
router.post('/login', userLogin);
router.post('/logout', userLogout);
router.get('/validate-token', authenticateJWT, validateToken);

// Session management routes
router.post('/ping-session', authenticateJWT, pingSession);
router.post('/validate-session', authenticateJWT, validateSession);

module.exports = router;