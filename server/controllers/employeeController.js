const {
  createEmployeeService,
  editEmployeeService,
  deleteEmployeeService,
  getAllEmployeesService,
  getEmployeeService,
  getOnlyGroupsEmployeesService
} = require("../services/employeeServices"); // Import services

// Create a new employee
const createEmployee = async (req, res) => {
  try {
    const { 
      name, 
      department, 
      punch_code, 
      designation, 
      reporting_group,
      net_hr,
      week_off,
      resign_date,
      status,
      branch,
      sections
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !department ||
      !punch_code ||
      !designation ||
      !reporting_group
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newEmployee = await createEmployeeService({
      name,
      department,
      punch_code,
      designation,
      reporting_group,
      net_hr,
      week_off,
      resign_date,
      status,
      branch,
      sections
    });

    res.status(201).json({
      message: "Employee created successfully!",
      employee: newEmployee,
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Edit an existing employee
const editEmployee = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { 
      name, 
      department, 
      punch_code, 
      designation, 
      reporting_group,
      net_hr,
      week_off,
      resign_date,
      status,
      branch,
      sections
    } = req.body;

    // Validate required fields
    if (!name || !department || !punch_code || !designation) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const updatedEmployee = await editEmployeeService(employee_id, {
      name,
      department,
      punch_code,
      designation,
      reporting_group,
      net_hr,
      week_off,
      resign_date,
      status,
      branch,
      sections
    });

    res.status(200).json({
      message: "Employee updated successfully!",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete an employee
const deleteEmployee = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const deletedEmployee = await deleteEmployeeService(employee_id);

    res.status(200).json({ message: "Employee deleted successfully!" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await getAllEmployeesService();
    res.status(200).json({ employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getEmployeeByGroup = async (req, res) => {
  // console.log("getEmployeeByGroup called");
  
  try {
    // Get groups from query parameters
    const { groups } = req.query;
    
    if (!groups) {
      return res.status(400).json({ message: "Please provide reporting groups" });
    }
    
    // If groups is sent as an array from the query
    let groupsArray = groups;
    
    // If groups is not an array, try to convert it to an array
    if (!Array.isArray(groups)) {
      groupsArray = [groups];
    }
    
    // console.log("Groups to fetch:", groupsArray);
    
    const employees = await getOnlyGroupsEmployeesService(groupsArray);
    res.status(200).json({ employees });
  } catch (error) {
    console.error("Error fetching employees by group:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get employee by ID
const getEmployee = async (req, res) => {
  // console.log("getEmployee called");
  
  try {
    const { employee_id } = req.params;

    const employee = await getEmployeeService(employee_id);

    res.status(200).json({ employee });
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createEmployee,
  editEmployee,
  deleteEmployee,
  getAllEmployees,
  getEmployee,
  getEmployeeByGroup
};