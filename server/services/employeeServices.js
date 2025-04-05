const { Employee } = require("../models"); // Import the Employee model
const {processNewEmployeeAttendance} =require("../utils/quickFunction");

// Service for creating a new employee
const createEmployeeService = async (employeeData) => {
  try {
    // console.log("employeeData", employeeData);
    const newEmployee = await Employee.create(employeeData);

    // Process attendance records for the new employee
    if (employeeData.reporting_group) {
      await processNewEmployeeAttendance(newEmployee.employee_id, employeeData.reporting_group);
    }

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
    employee.reporting_group = updatedData.reporting_group;
    
    // Update the new fields
    employee.net_hr = updatedData.net_hr;
    employee.week_off = updatedData.week_off;
    employee.resign_date = updatedData.resign_date;
    employee.status = updatedData.status;
    employee.branch = updatedData.branch;
    employee.sections = updatedData.sections;

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

// Service for fetching employees filtered by reporting groups
const getOnlyGroupsEmployeesService = async (groups) => {
  try {
    const employees = await Employee.findAll({
      where: {
        reporting_group: {
          [Op.in]: groups // Use Sequelize's "in" operator to match any of the provided groups
        }
      }
    });
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
  getOnlyGroupsEmployeesService
};
