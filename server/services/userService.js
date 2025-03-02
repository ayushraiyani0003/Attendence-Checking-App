// services/userService.js
const User = require('../models/user'); // Assuming you have Sequelize or any ORM model set up

// This function will fetch user by username from the database
const findUserByUsername = async (username) => {
  return await User.findOne({ where: { username } });
};

module.exports = { findUserByUsername };
