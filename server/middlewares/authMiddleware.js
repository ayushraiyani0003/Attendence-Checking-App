const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = require('../utils/constants');

const authenticateJWT = (req, res, next) => {
  // console.log('All cookies received:', req.cookies);
  // console.log('Headers:', req.headers);
  
  // Try to get token from cookie first
  let token = req.cookies.authToken;
  
  // If no cookie token, check Authorization header
  if (!token) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('Found token in Authorization header');
    }
  }

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
    if (err) {
      console.log('Invalid or expired token');
      return res.status(403).json({ message: 'Invalid or expired token. Please log in again.' });
    }

    // Store user info in the request object for further use
    req.user = user;

    // Proceed to the next middleware or route handler
    next();
  });
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