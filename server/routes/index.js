const express = require("express");
const authRouter = require("./authRoutes"); // Import authentication routes
const settingRouter = require("./settingRoutes"); // Import setting routes
const userRouter = require("./userRoutes"); // Import user routes
const employeeRoutes = require("./employeeRoutes"); // Import employee routes
const metricsRoutes = require("./metricsRoutes"); // Import metrics routes
const dashboardRoutes = require("./dashboardRoutes"); // Import dashboard routes
const sessionRoutes = require("./sessionsRoutes"); // Import sessions routes
const notificationRoutes = require("./notificationRoutes"); // Import notification routes
const attendanceLogsRoutes = require("./attendanceLogsRoutes"); // Import notification routes

const router = express.Router();

router.use("/auth", authRouter); // Prefix authentication routes with /auth
router.use("/setting", settingRouter); // Prefix setting routes with /setting
router.use("/users", userRouter); // Prefix user routes with /user
router.use("/employees", employeeRoutes); // Prefix employee routes with /employees
router.use("/metrics", metricsRoutes); // Prefix metrics routes with /metrics
router.use("/dashboard", dashboardRoutes); // Prefix dashboard routes with /dashboard
router.use("/sessions", sessionRoutes); // Prefix session routes with /sessions
router.use("/notifications", notificationRoutes); // Prefix notification routes with /notifications
router.use("/attendance-logs", attendanceLogsRoutes); // Prefix notification routes with /notifications

module.exports = router;