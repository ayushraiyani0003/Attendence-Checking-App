const { Employee } = require("../models"); // Import the Employee model

// Service for creating a new employee
const createEmployeeService = async (employeeData) => {
  try {
    console.log("employeeData", employeeData);

    const newEmployee = await Employee.create(employeeData);
    return newEmployee;
  } catch (error) {
    throw new Error("Error creating employee: " + error.message);
  }
};

// Service for editing an existing employee
const editEmployeeService = async (employeeId, updatedData) => {
  try {
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    // Update employee fields
    employee.name = updatedData.name;
    employee.department = updatedData.department;
    employee.punch_code = updatedData.punch_code;
    employee.designation = updatedData.designation;

    await employee.save();
    return employee;
  } catch (error) {
    throw new Error("Error updating employee: " + error.message);
  }
};

// Service for deleting an employee
const deleteEmployeeService = async (employeeId) => {
  try {
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    await employee.destroy();
    return employee;
  } catch (error) {
    throw new Error("Error deleting employee: " + error.message);
  }
};

// Service for fetching all employees
const getAllEmployeesService = async () => {
  try {
    const employees = await Employee.findAll();
    return employees;
  } catch (error) {
    throw new Error("Error fetching employees: " + error.message);
  }
};

// Service for fetching an employee by ID
const getEmployeeService = async (employeeId) => {
  try {
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }
    return employee;
  } catch (error) {
    throw new Error("Error fetching employee: " + error.message);
  }
};

module.exports = {
  createEmployeeService,
  editEmployeeService,
  deleteEmployeeService,
  getAllEmployeesService,
  getEmployeeService,
};
