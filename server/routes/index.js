// routes/index.js
const express = require("express");
const authRouter = require("./authRoutes"); // Import authentication routes
const settingRouter = require("./settingRoutes"); // Import setting routes
const userRouter = require("./userRoutes"); // Import user routes
const employeeRoutes = require("./employeeRoutes"); // Import employee routes
<<<<<<< HEAD
const metricsRoutes = require("./metricsRoutes"); // Import metrics routes
=======
const attendanceRoutes = require("./attendanceRoutes"); // Import the attendance routes
>>>>>>> 0f1e39e0f3d3747667063dc46005d7b53850abce

const router = express.Router();

router.use("/auth", authRouter); // Prefix authentication routes with /auth
router.use("/setting", settingRouter); // Prefix setting routes with /setting
router.use("/users", userRouter); // Prefix user routes with /user
router.use("/employees", employeeRoutes); // Prefix employee routes with /employees
<<<<<<< HEAD
router.use("/metrics", metricsRoutes); // Prefix metrics routes with /metrics
=======
router.use("/attendance", attendanceRoutes); // Prefix attendance routes with /attendance
>>>>>>> 0f1e39e0f3d3747667063dc46005d7b53850abce

module.exports = router;
