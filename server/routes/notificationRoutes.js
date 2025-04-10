const express = require('express');
const router = express.Router();
const headerMessageController = require('../controllers/headerMessageController');
const popupMessageController = require('../controllers/popupMessageController');
const { authenticateJWT, isAdmin } = require("../middlewares/authMiddleware");

// Header message routes
router.get('/header', headerMessageController.getAllHeaderMessages);
router.get('/header/active', headerMessageController.getActiveHeaderMessages);
router.post('/header', authenticateJWT, isAdmin, headerMessageController.createHeaderMessage);
router.patch('/header/:id/toggle', authenticateJWT, isAdmin, headerMessageController.toggleHeaderMessageStatus);
router.delete('/header/:id', authenticateJWT, isAdmin, headerMessageController.deleteHeaderMessage);

// Popup message routes
router.get('/popup', popupMessageController.getAllPopupMessages);
router.get('/popup/active', popupMessageController.getActivePopupMessages);
router.get('/popup/current', popupMessageController.getCurrentPopupMessages);
router.post('/popup', authenticateJWT, isAdmin, popupMessageController.createPopupMessage);
router.patch('/popup/:id/toggle', authenticateJWT, isAdmin, popupMessageController.togglePopupMessageStatus);
router.delete('/popup/:id', authenticateJWT, isAdmin, popupMessageController.deletePopupMessage);

// Client-facing route to get all active notifications
router.get('/client', async (req, res) => {
  try {
    // Use both services to get active notifications
    const [headerMessages, popupMessages] = await Promise.all([
      require('../services/headerMessageService').getActiveHeaderMessages(),
      require('../services/popupMessageService').getCurrentPopupMessages(),
    ]);
    
    res.status(200).json({
      headerMessages,
      popupMessages
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;