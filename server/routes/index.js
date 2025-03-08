// routes/index.js
const express = require('express');
const authRouter = require('./authRoutes');  // Import authentication routes
const settingRouter = require('./settingRoutes');  // Import setting routes
const userRouter = require('./userRoutes');  // Import user routes
const router = express.Router();


router.use('/auth', authRouter);  // Prefix authentication routes with /auth
router.use('/setting', settingRouter);  // Prefix setting routes with /setting
router.use('/users', userRouter);  // Prefix user routes with /user

module.exports = router;
