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

router.route('/departments')
  .get(authenticateJWT, isAdmin, settingController.getSettings); // Fetch departments (admin-only)

router.route('/designations')
  .get(authenticateJWT, isAdmin, settingController.getSettings); // Fetch designations (admin-only)

router.route('/reporting-groups')
  .get(authenticateJWT, isAdmin, settingController.getSettings); // Fetch reporting groups (admin-only) 
  
module.exports = router;
