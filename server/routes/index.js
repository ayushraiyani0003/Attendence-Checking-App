// routes/index.js
const express = require('express');
const authRouter = require('./authRoutes');  // Import authentication routes
const router = express.Router();

router.use('/auth', authRouter);  // Prefix authentication routes with /auth

module.exports = router;
