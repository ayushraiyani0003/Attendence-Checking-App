// services/userService.js
const User = require('../models/user'); // Assuming you have Sequelize or any ORM model set up

// This function will fetch user by username from the database
const findUserByUsername = async (username) => {
  return await User.findOne({ where: { username } });
};


// Get all users
const getAllUsers = async () => {
  try {
    const users = await User.findAll();
    // console.log('Users response:', users);
    return users;
  } catch (error) {
    throw new Error('Error fetching users');
  }
};

// Create a new user
const createUser = async (userData) => {
  try {
    console.log("userData: ", userData);
    const newUser = await User.create(userData);
    console.log("newUser: ", newUser);
    return newUser;
  } catch (error) {
    console.log("error: ", error);
    throw new Error('Error creating user');
  }
};

// Update an existing user by ID
const updateUser = async (id, userData) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }
    await user.update(userData);
    return user;
  } catch (error) {
    throw new Error('Error updating user');
  }
};

// Delete a user by ID
const deleteUser = async (id) => {
  try {
    // console.log("this called");
    const user = await User.findByPk(id);
    // console.log("user", user);
    if (!user) {
      throw new Error('User not found');
    }
    await user.destroy();
    return user;
  } catch (error) {
    console.log("error", error);
    throw new Error('Error deleting user');
  }
};

module.exports = { findUserByUsername, getAllUsers, createUser, updateUser, deleteUser };
