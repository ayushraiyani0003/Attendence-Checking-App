const { Employee } = require("../models"); // Import the Employee model
const { Op } = require("sequelize"); // Import Sequelize operators
const { processNewEmployeeAttendance } = require("../utils/quickFunction");

// Service for creating a new employee
const createEmployeeService = async (employeeData) => {
    try {
        // console.log("employeeData", employeeData);
        const dataForDatabase = {
            ...employeeData,
            // Only add mobile_number and whats_app_number if they exist in employeeData
            ...(employeeData.mobile_no !== undefined && {
                mobile_number: employeeData.mobile_no,
            }),
            ...(employeeData.whatsApp_no !== undefined && {
                whats_app_number: employeeData.whatsApp_no,
            }),
        };

        const newEmployee = await Employee.create(dataForDatabase);

        // Process attendance records for the new employee
        if (employeeData.reporting_group) {
            await processNewEmployeeAttendance(
                newEmployee.employee_id,
                employeeData.reporting_group
            );
        }

        return newEmployee;
    } catch (error) {
        throw new Error("Error creating employee: " + error.message);
    }
};

// Service for editing an existing employee
const editEmployeeService = async (employeeId, updatedData) => {
    // console.log(updatedData);

    try {
        const employee = await Employee.findByPk(employeeId);
        if (!employee) {
            throw new Error("Employee not found");
        }

        // Update required employee fields
        employee.name = updatedData.name;
        employee.department = updatedData.department;
        employee.punch_code = updatedData.punch_code;
        employee.designation = updatedData.designation;
        employee.reporting_group = updatedData.reporting_group;
        employee.net_hr = updatedData.net_hr;
        employee.week_off = updatedData.week_off;
        employee.branch = updatedData.branch;
        employee.sections = updatedData.sections;
        employee.division = updatedData.division;

        // Only update optional fields if they are provided
        if (updatedData.mobile_no !== undefined) {
            employee.mobile_number = updatedData.mobile_no;
        }

        if (updatedData.whatsApp_no !== undefined) {
            employee.whats_app_number = updatedData.whatsApp_no;
        }

        if (updatedData.resign_date !== undefined) {
            employee.resign_date = updatedData.resign_date;
        }

        if (updatedData.status !== undefined) {
            employee.status = updatedData.status;
        }

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
        // console.log("Getting employees for groups:", groups);

        const employees = await Employee.findAll({
            where: {
                reporting_group: {
                    [Op.in]: groups, // Use Sequelize's "in" operator to match any of the provided groups
                },
            },
        });

        // console.log(`Found ${employees.length} employees in the specified groups`);
        return employees;
    } catch (error) {
        console.error("Service error:", error);
        throw new Error("Error fetching employees by group: " + error.message);
    }
};

// Service for fetching an employee by ID
const getEmployeeService = async (employeeId) => {
    // console.log("Fetching employee with ID:", employeeId);

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
    getOnlyGroupsEmployeesService,
};
