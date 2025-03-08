const { JWT_SECRET_KEY } = require('../utils/constants');
const jwt = require('jsonwebtoken');

// Middleware to validate user data and ensure user is an admin
const validateUser = (req, res, next) => {
  const { username, name, phoneNo, department, designation, reportingGroup, password } = req.body;

  // Check if all required fields are provided
  if (!username || !name || !phoneNo || !department || !designation || !reportingGroup) {
    return res.status(400).json({ error: 'All required fields must be filled.' });
  }

  // Look for the token in cookies or Authorization header
  const token = req.cookies.authToken || req.headers['authorization']?.split(' ')[1];  // Check both

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Verify JWT Token
  jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token. Please log in again.' });
    }

    // Attach user data to request object
    req.user = user;

    // Ensure the user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied: You do not have admin privileges' });
    }

    // If validation passes, proceed to the next middleware or controller
    next();
  });
};

module.exports = validateUser;
