const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = require('../utils/constants');

// Middleware to authenticate JWT and check user role
const authenticateJWT = (req, res, next) => {
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

  jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
    if (err) {
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
    return next();  // If the user is an admin, proceed
  } else {
    return res.status(403).json({ message: 'Access Denied: You do not have admin privileges' });
  }
};

// Middleware to ensure the user can edit attendance (regular users can only edit their own attendance)
const canEditAttendance = (req, res, next) => {
  const { employeeId } = req.params;  // Assume the employeeId is passed as a route parameter

  if (req.user && (req.user.role === 'admin' || req.user.id === parseInt(employeeId))) {
    // Admin can edit all attendance records, users can edit only their own
    return next();
  } else {
    return res.status(403).json({ message: 'Access Denied: You can only edit your own attendance.' });
  }
};

module.exports = { authenticateJWT, isAdmin, canEditAttendance };
