const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { findUserByUsername } = require('../services/userService');
const { JWT_SECRET_KEY } = require('../utils/constants');
const User = require('../models/user');
const Session = require('../models/session'); // Import the Session model
const { Op } = require('sequelize');

// Generate a unique session ID
const generateSessionId = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate a unique device ID based on request data
const generateDeviceId = (req) => {
  const fingerprint = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.ip || req.connection.remoteAddress
  ].join('|');
  
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
};

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

    // Update last login timestamp
    await User.update({ last_login: new Date() }, { where: { id: user.id } });

    // Generate device ID from request
    const deviceId = generateDeviceId(req);
    
    // Check if user is already logged in on another device
    const existingSession = await Session.findOne({
      where: {
        userId: user.id,
        isActive: true,
        deviceId: { [Op.ne]: deviceId } // not equal to current device
      }
    });

    if (existingSession) {
      // Return an error message but don't force logout on other device
      return res.status(409).json({
        message: 'You are already logged in on another device',
        alreadyLoggedIn: true
      });
    }

    // Generate a new session ID
    const sessionId = generateSessionId();
    
    // Create a new session
    await Session.create({
      userId: user.id,
      sessionId,
      deviceId,
      lastActive: new Date(),
      isActive: true
    });

    // Generate JWT token with session info
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.user_role, 
        name: user.name, 
        userReportingGroup: user.reporting_group,
        sessionId
      },
      JWT_SECRET_KEY,
      { expiresIn: '1d' }
    );

    // Set cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'None',
      path: '/'
    });
    
    // Return response with token and session ID
    return res.status(200).json({
      message: 'Login successful',
      token: token,
      sessionId: sessionId,
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.user_role, 
        name: user.name, 
        userReportingGroup: user.reporting_group
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

const userLogout = async (req, res) => {
  try {
    // Get the session ID from the token
    const token = req.cookies.authToken || 
                 (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
                  ? req.headers.authorization.substring(7) : null);
    
    if (token) {
      try {
        // Decode token to get session ID
        const decoded = jwt.verify(token, JWT_SECRET_KEY);
        
        if (decoded.sessionId) {
          // Invalidate the session
          await Session.update(
            { isActive: false },
            { where: { sessionId: decoded.sessionId } }
          );
        }
      } catch (error) {
        // Token might be invalid, just continue with logout
        console.error('Error decoding token during logout:', error);
      }
    }
    
    // Clear cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'None',
      path: '/'
    });
    
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Something went wrong during logout' });
  }
};

// Token validation handler
const validateToken = async (req, res) => {
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

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    
    // Check if session is still active
    if (decoded.sessionId) {
      const session = await Session.findOne({
        where: {
          sessionId: decoded.sessionId,
          isActive: true
        }
      });
      
      if (!session) {
        return res.status(403).json({ message: 'Session expired or invalid' });
      }
      
      // Update last active timestamp
      await Session.update(
        { lastActive: new Date() },
        { where: { sessionId: decoded.sessionId } }
      );
    }
    
    res.status(200).json({
      message: 'Token is valid',
      user: {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        name: decoded.name,
        userReportingGroup: decoded.userReportingGroup,
      },
      sessionId: decoded.sessionId
    });
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Keep session alive / ping
const pingSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    // Update last active timestamp
    const updated = await Session.update(
      { lastActive: new Date() },
      { where: { sessionId, isActive: true } }
    );
    
    if (updated[0] === 0) {
      return res.status(404).json({ message: 'Session not found or inactive' });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Ping session error:', error);
    return res.status(500).json({ message: 'Error updating session' });
  }
};

// Validate session is still active (for tab visibility check)
const validateSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    const session = await Session.findOne({
      where: { sessionId, isActive: true }
    });
    
    if (!session) {
      return res.json({ valid: false });
    }
    
    // Update last active timestamp
    await Session.update(
      { lastActive: new Date() },
      { where: { sessionId } }
    );
    
    return res.json({ valid: true });
  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({ message: 'Error validating session' });
  }
};
// Session cleanup - can be called periodically to clean up stale sessions
const cleanupSessions = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Delete inactive or stale sessions
    const result = await Session.destroy({
      where: {
        [Op.or]: [
          { isActive: false },
          { lastActive: { [Op.lt]: oneDayAgo } }
        ]
      }
    });
    
    return res.status(200).json({ 
      message: 'Session cleanup completed', 
      sessionsRemoved: result 
    });
  } catch (error) {
    console.error('Session cleanup error:', error);
    return res.status(500).json({ message: 'Error during session cleanup' });
  }
};

module.exports = { 
  userLogin, 
  validateToken, 
  userLogout,
  pingSession,
  validateSession,
};