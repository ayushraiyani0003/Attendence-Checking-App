const headerMessageService = require('../services/headerMessageService');

// Get all header messages
exports.getAllHeaderMessages = async (req, res) => {
  try {
    const messages = await headerMessageService.getAllHeaderMessages();
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active header messages only
exports.getActiveHeaderMessages = async (req, res) => {
  try {
    const messages = await headerMessageService.getActiveHeaderMessages();
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new header message
exports.createHeaderMessage = async (req, res) => {
  try {
    const { message } = req.body;
    
    // Simple validation
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    const newMessage = await headerMessageService.createHeaderMessage({
      message,
      active: true
    });
    
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle header message active status
exports.toggleHeaderMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMessage = await headerMessageService.toggleHeaderMessageStatus(id);
    
    if (!updatedMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a header message
exports.deleteHeaderMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await headerMessageService.deleteHeaderMessage(id);
    
    if (!result) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};