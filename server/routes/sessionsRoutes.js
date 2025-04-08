// routes/sessionRoutes.js
const express = require("express");
const { authenticateJWT, isAdmin } = require("../middlewares/authMiddleware");
const Session = require("../models/session"); // Adjust path as needed
const router = express.Router();

// Controller function for deleting sessions
const deleteSessions = async (req, res) => {
  try {
    // Check if specific userId provided in query params
    if (req.query.userId) {
      await Session.destroy({
        where: { userId: req.query.userId }
      });
      return res.status(200).json({ 
        success: true, 
        message: `All sessions for user ID ${req.query.userId} deleted successfully` 
      });
    }
    
    // Option to delete inactive sessions
    if (req.query.inactive === 'true') {
      await Session.cleanupOldSessions();
      return res.status(200).json({ 
        success: true, 
        message: "Inactive sessions deleted successfully" 
      });
    }
    
    // Option to delete sessions older than one week
    if (req.query.olderThanWeek === 'true') {
      await Session.cleanupWeekOldSessions();
      return res.status(200).json({ 
        success: true, 
        message: "Sessions older than one week deleted successfully" 
      });
    }
    
    // If no specific query provided, delete all sessions
    await Session.destroy({ where: {} });
    return res.status(200).json({ 
      success: true, 
      message: "All sessions deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting sessions:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to delete sessions", 
      error: error.message 
    });
  }
};

// Route for deleting sessions - admin only
router.delete("/", authenticateJWT, isAdmin, deleteSessions);

module.exports = router;