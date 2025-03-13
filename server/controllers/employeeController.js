const { Employee } = require('../models');  // Assuming Employee model is in 'models' directory
const { isAdmin } = require('../middleware/authMiddleware'); // Assuming isAdmin middleware
const { authenticateJWT } = require('../middleware/authMiddleware'); // Assuming authenticateJWT middleware

// Create a new employee
const createEmployee = async (req, res) => {
  try {
    const { name, department, punch_code, designation } = req.body;

    // Validate required fields
    if (!name || !department || !punch_code || !designation) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Create a new employee
    const newEmployee = await Employee.create({
      name,
      department,
      punch_code,
      designation,
    });

    res.status(201).json({ message: 'Employee created successfully!', employee: newEmployee });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Edit an existing employee
const editEmployee = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { name, department, punch_code, designation } = req.body;

    // Validate required fields
    if (!name || !department || !punch_code || !designation) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Find employee by ID
    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update employee details
    employee.name = name;
    employee.department = department;
    employee.punch_code = punch_code;
    employee.designation = designation;

    await employee.save();

    res.status(200).json({ message: 'Employee updated successfully!', employee });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete an employee
const deleteEmployee = async (req, res) => {
  try {
    const { employee_id } = req.params;

    // Find employee by ID
    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Delete the employee
    await employee.destroy();

    res.status(200).json({ message: 'Employee deleted successfully!' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll();
    res.status(200).json({ employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Example of an API route requiring admin access
const getEmployee = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({ employee });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createEmployee,
  editEmployee,
  deleteEmployee,
  getAllEmployees,
  getEmployee,
};
