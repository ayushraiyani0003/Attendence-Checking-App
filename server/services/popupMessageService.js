const { PopupMessage } = require('../models');
const { Op } = require('sequelize');

// Get all popup messages
exports.getAllPopupMessages = async () => {
    
  return await PopupMessage.findAll({
    order: [['startTime', 'DESC']]
  });
};

// Get only active popup messages
exports.getActivePopupMessages = async () => {
  return await PopupMessage.findAll({
    where: { active: true },
    order: [['startTime', 'DESC']]
  });
};

// Get current active popup messages (based on time)
exports.getCurrentPopupMessages = async () => {
  const now = new Date();
  
  return await PopupMessage.findAll({
    where: {
      active: true,
      startTime: { [Op.lte]: now },
      endTime: { [Op.gte]: now }
    },
    order: [['startTime', 'ASC']]
  });
};

// Create a new popup message
exports.createPopupMessage = async (messageData) => {
  return await PopupMessage.create(messageData);
};

// Toggle a popup message's active status
exports.togglePopupMessageStatus = async (id) => {
  const message = await PopupMessage.findByPk(id);
  
  if (!message) {
    return null;
  }
  
  message.active = !message.active;
  await message.save();
  
  return message;
};

// Delete a popup message
exports.deletePopupMessage = async (id) => {
  const message = await PopupMessage.findByPk(id);
  
  if (!message) {
    return null;
  }
  
  await message.destroy();
  return true;
};