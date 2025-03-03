const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { findUserByUsername } = require('../services/userService');
const { JWT_SECRET_KEY } = require('../utils/constants');
const User = require('../models/user');

const userLogin = async (req, res) => {
  console.log('Login request received');
  const { username, password } = req.body;
  console.log('Username:', username);
  console.log('Password:', password);

  if (!username || !password) {
    console.log('Username and password are required.');
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const user = await findUserByUsername(username);
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    // log the encrepted password
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    await User.update({ last_login: new Date() }, { where: { id: user.id } });

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.user_role, name: user.name },
      JWT_SECRET_KEY,
      { expiresIn: '1d' }
    );

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'Strict',
    });

    console.log('Login successful');
    res.status(200).json({
      
      message: 'Login successful',
      user: { id: user.id, username: user.username, role: user.user_role, name: user.name },
    });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

const validateToken = (req, res) => {
  const token = req.cookies.authToken;  // Retrieve token from cookies

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Verify token and respond with user data if valid
  jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Send back user data if token is valid
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

module.exports = { userLogin , validateToken};
