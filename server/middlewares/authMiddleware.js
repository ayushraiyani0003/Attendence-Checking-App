// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = require('../utils/constants');

const authenticateJWT = (req, res, next) => {
  const token = req.cookies.authToken; // Get the token from cookies

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

module.exports = { authenticateJWT };
