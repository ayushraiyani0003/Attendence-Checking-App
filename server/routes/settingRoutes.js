const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authenticateJWT, isAdmin } = require('../middlewares/authMiddleware');

// Route to handle GET and POST requests for settings (only accessible by admin)
// GET: Fetch departments and designations
// POST: Update departments and designations
router.route('/')
  .get(authenticateJWT, isAdmin, settingController.getSettings)   // Fetch departments and designations (admin-only)
  .post(authenticateJWT, isAdmin, settingController.updateSettings); // Update departments and designations (admin-only)

// Route to handle DELETE requests for department and designation by ID (only accessible by admin)
// DELETE: Remove department by ID
router.route('/department/:id')
  .delete(authenticateJWT, isAdmin, settingController.deleteDepartment); // Delete department by ID

// DELETE: Remove designation by ID
router.route('/designation/:id')
  .delete(authenticateJWT, isAdmin, settingController.deleteDesignation); // Delete designation by ID

module.exports = router;
