const express = require("express");
const multer = require("multer");
const { authenticateJWT, isAdmin } = require("../middlewares/authMiddleware"); // Assuming authentication and admin checking middlewares
const metricsController = require("../controllers/metricsController");

const router = express.Router();

// Set up multer for file handling
const upload = multer({ dest: "uploads/" });

// Route for handling metrics file upload
router.post(
  "/upload-metrics",
  authenticateJWT, // JWT authentication middleware
  isAdmin, // Admin check middleware
  upload.fields([{ name: "networkFile" }, { name: "otFile" }]), // Fields for the files
  metricsController.handleMetricsUpload // Controller to handle the uploaded files
);

module.exports = router;
