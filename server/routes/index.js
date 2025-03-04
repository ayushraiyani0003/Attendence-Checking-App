// routes/index.js
const express = require('express');
const authRouter = require('./authRoutes');  // Import authentication routes
const settingRouter = require('./settingRoutes');  // Import setting routes
const router = express.Router();

router.use('/auth', authRouter);  // Prefix authentication routes with /auth
router.use('/setting', settingRouter);  // Prefix setting routes with /setting

module.exports = router;
