const popupMessageService = require('../services/popupMessageService');

// Get all popup messages
exports.getAllPopupMessages = async (req, res) => {
  try {
    const messages = await popupMessageService.getAllPopupMessages();
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active popup messages only
exports.getActivePopupMessages = async (req, res) => {
  try {
    const messages = await popupMessageService.getActivePopupMessages();
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current active popup messages (based on time)
exports.getCurrentPopupMessages = async (req, res) => {
  try {
    const messages = await popupMessageService.getCurrentPopupMessages();
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new popup message
exports.createPopupMessage = async (req, res) => {
  try {
    const { title, message, startTime, endTime } = req.body;
    
    // Simple validation
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Start time and end time are required' });
    }
    
    // Validate that start time is before end time
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }
    
    const newMessage = await popupMessageService.createPopupMessage({
      title,
      message,
      startTime,
      endTime,
      active: true
    });
    
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle popup message active status
exports.togglePopupMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMessage = await popupMessageService.togglePopupMessageStatus(id);
    
    if (!updatedMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a popup message
exports.deletePopupMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await popupMessageService.deletePopupMessage(id);
    
    if (!result) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};