const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = require('../utils/constants');
const Session = require('../models/session');

const authenticateJWT = async (req, res, next) => {
  // Try to get token from cookie first
  let token = req.cookies.authToken;
  
  // If no cookie token, check Authorization header
  if (!token) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    
    // Check if session is valid if sessionId is present
    if (decoded.sessionId) {
      const session = await Session.findOne({ 
        where: { 
          sessionId: decoded.sessionId,
          isActive: true
        } 
      });
      
      if (!session) {
        return res.status(403).json({ 
          message: 'Your session has expired or you have logged in on another device.',
          sessionExpired: true
        });
      }
      
      // Update last active timestamp
      await Session.update(
        { lastActive: new Date() },
        { where: { sessionId: decoded.sessionId } }
      );
    }
    
    // Store user info in the request object for further use
    req.user = decoded;
    
    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ message: 'Invalid or expired token. Please log in again.' });
  }
};

// Middleware to ensure the user is an admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();  // If the user is an admin, proceed
  } else {
    return res.status(403).json({ message: 'Access Denied: You do not have admin privileges' });
  }
};

module.exports = { authenticateJWT, isAdmin };