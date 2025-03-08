const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Import the controller
const { authenticateJWT, isAdmin } = require('../middlewares/authMiddleware'); // Import middleware

// Route to get all users (requires JWT authentication, not necessarily admin role)
router.get('/', authenticateJWT, userController.getAllUsers);

// Route to create a new user (requires JWT authentication and admin role)
router.post('/create', authenticateJWT, isAdmin, userController.createUser);

// Route to update an existing user (requires JWT authentication and admin role)
router.put('/update/:id', authenticateJWT, isAdmin, userController.updateUser);

// Route to delete a user (requires JWT authentication and admin role)
router.delete('/delete/:id', authenticateJWT, isAdmin, userController.deleteUser);

module.exports = router;
