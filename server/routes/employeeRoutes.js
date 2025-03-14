const express = require("express");
const router = express.Router();
const { authenticateJWT, isAdmin } = require("../middlewares/authMiddleware"); // Assuming authentication and admin checking middlewares
const validateUser = require("../middlewares/userMiddleware"); // Validation middleware
const {
  createEmployee,
  editEmployee,
  deleteEmployee,
  getAllEmployees,
  getEmployee,
} = require("../controllers/employeeController");

// Routes for employee management
router.post("/", authenticateJWT, isAdmin, createEmployee); // Create an employee
router.put("/:employee_id", authenticateJWT, isAdmin, editEmployee); // Edit an employee
router.delete("/:employee_id", authenticateJWT, isAdmin, deleteEmployee); // Delete an employee
router.get("/", authenticateJWT, isAdmin, getAllEmployees); // Get all employees
router.get("/:employee_id", authenticateJWT, isAdmin, getEmployee); // Get employee by ID

module.exports = router;
