const {
  createEmployeeService,
  editEmployeeService,
  deleteEmployeeService,
  getAllEmployeesService,
  getEmployeeService,
} = require("../services/employeeServices"); // Import services

// Create a new employee
const createEmployee = async (req, res) => {
  try {
    const { name, department, punch_code, designation, reporting_group } =
      req.body;

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
    const { name, department, punch_code, designation, reporting_group } =
      req.body;

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

// Get employee by ID
const getEmployee = async (req, res) => {
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
};
