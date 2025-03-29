const userService = require('../services/userService');  // Import the user service
const bcrypt = require('bcrypt');
const isActive = 1;

// Get all users
// Controller to fetch all users
const getAllUsers = async (req, res) => {
    try {

    //  console.log("getAllUsers");
        
      const users = await userService.getAllUsers();  // Fetch all users from the DB
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching users' });
    }
  };

  const createUser = async (req, res) => {
    // console.log("createUser", req.body);  // Log the entire request body for debugging
  
    const { username, name, phoneNo, department, designation, userRole, password, reportingGroup, isActive } = req.body;
  
    // Check if required fields are provided
    if (!phoneNo || !userRole) {
      return res.status(400).json({ error: 'Phone number and user role are required.' });
    }
  
    // Map the frontend field names to the backend database field names
    const newUserData = {
      username,
      name,
      phone_no: phoneNo,  // Map phoneNo to phone_no
      department,
      designation,
      user_role: userRole,  // Map userRole to user_role
      isActive: isActive || 1,  // If isActive is not passed, default to 1
      password: password,
      reporting_group: reportingGroup  // Ensure correct field name
    };
  
    try {
      // Pass the correctly mapped data to the userService to create the user
      const newUser = await userService.createUser(newUserData);
      return res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);  // Log the error for debugging
      return res.status(500).json({ error: 'Error creating user' });
    }
  };
  
  
  
  // Controller to update a user
  const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, name, phoneNo, department, designation, userRole, password, reportingGroup } = req.body;
    try {
      const user = await userService.updateUser(id, { 
        username,
      name,
      phone_no: phoneNo,  // Map phoneNo to phone_no
      department,
      designation,
      user_role: userRole,  // Map userRole to user_role
      isActive: isActive || 1,  // If isActive is not passed, default to 1
      password: password,
      reporting_group: reportingGroup  // Ensure correct field name
       });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      await user.update({ 
        username,
        name,
        phone_no: phoneNo,  // Map phoneNo to phone_no
        department,
        designation,
        user_role: userRole,  // Map userRole to user_role
        isActive: isActive || 1,  // If isActive is not passed, default to 1
        password: password,
        reporting_group: reportingGroup  // Ensure correct field name
       });
      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Error updating user' });
    }
  };
  
  // Controller to delete a user
  const deleteUser = async (req, res) => {
    // console.log("deleteUser");
    const { id } = req.params;
    try {
      const user = await userService.deleteUser(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      await user.destroy();
      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Error deleting user' });
    }
  };

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};
