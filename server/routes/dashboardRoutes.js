// routes/dashboardRoutes.js
const express = require("express");
const { getDashboardGraphs, getDashboardReports} = require("../controllers/dashboardController");
const { authenticateJWT, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// Apply authentication middleware to all dashboard routes
router.use(authenticateJWT);

// Get dashboard graph data
router.get("/graphs", getDashboardGraphs);

// Get dashboard reports - only admins can access reports
router.get("/reports", isAdmin, getDashboardReports);

module.exports = router;