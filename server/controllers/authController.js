const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { findUserByUsername } = require('../services/userService');
const { JWT_SECRET_KEY } = require('../utils/constants');
const User = require('../models/user');

// User login handler
const userLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    await User.update({ last_login: new Date() }, { where: { id: user.id } });

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.user_role, name: user.name },
      JWT_SECRET_KEY,
      { expiresIn: '1d' }
    );

    // Still set the cookie for environments where it might work
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'None',
      path: '/'
    });

    // Return the token in the response body as well
    return res.status(200).json({
      message: 'Login successful',
      token: token, // Include token in response
      user: { id: user.id, username: user.username, role: user.user_role, name: user.name },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

const userLogout = (req, res) => {
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: false,
    sameSite: 'None',
    path: '/'
  });
  
  return res.status(200).json({ message: 'Logged out successfully' });
};

// Token validation handler
const validateToken = (req, res) => {
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
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    res.status(200).json({
      message: 'Token is valid',
      user: {
        id: user.userId,
        username: user.username,
        role: user.role,
        name: user.name,
      },
    });
  });
};

module.exports = { userLogin, validateToken, userLogout };