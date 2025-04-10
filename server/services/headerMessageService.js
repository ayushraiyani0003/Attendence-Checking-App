const { HeaderMessage } = require('../models');

// Get all header messages
exports.getAllHeaderMessages = async () => {
  return await HeaderMessage.findAll({
    order: [['createdAt', 'DESC']]
  });
};

// Get only active header messages
exports.getActiveHeaderMessages = async () => {
  return await HeaderMessage.findAll({
    where: { active: true },
    order: [['createdAt', 'DESC']]
  });
};

// Create a new header message
exports.createHeaderMessage = async (messageData) => {
  return await HeaderMessage.create(messageData);
};

// Toggle a header message's active status
exports.toggleHeaderMessageStatus = async (id) => {
    console.log("this is caled");
    
  const message = await HeaderMessage.findByPk(id);
  
  if (!message) {
    return null;
  }
  
  message.active = !message.active;
  await message.save();
  
  return message;
};

// Delete a header message
exports.deleteHeaderMessage = async (id) => {
  const message = await HeaderMessage.findByPk(id);
  
  if (!message) {
    return null;
  }
  
  await message.destroy();
  return true;
};