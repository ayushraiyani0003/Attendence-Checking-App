// getEmployeesByGroup.js
const { Op } = require('sequelize');  // Import Op from sequelize
const { Employee, Attendance } = require('../models'); // Assuming Employee and Attendance models are defined

// Function to get all employees for a selected group
async function getEmployeesByGroup(groups) {
  try {
    // Fetch employees where 'reporting_group' matches any of the groups provided
    const employees = await Employee.findAll({
      where: {
        reporting_group: {
          [Op.in]: groups, // Sequelize 'Op.in' allows matching multiple groups
        },
      },
    });

    // Return the employee data
    return employees;
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error; // Throw error to be handled by the caller
  }
}

// New function to get all attendance for employees in the selected group and month
async function getEmployeesAttendanceByMonthAndGroup(groups, year, month) {
    try {
      // Fetch employees for the selected group
      const employees = await getEmployeesByGroup(groups);
  
      // Extract employee IDs from the fetched employees
      const employeeIds = employees.map(employee => employee.employee_id);
  
      // Create a map of employee IDs to their reporting groups
      const employeeGroupMap = employees.reduce((map, employee) => {
        map[employee.employee_id] = employee.reporting_group;
        return map;
      }, {});
  
      // Calculate the start and end of the selected month
      const startDate = new Date(year, month - 1, 1); // First date of the month
      const endDate = new Date(year, month, 0); // Last date of the month
  
      // Fetch attendance data for the selected employees and month
      const attendanceData = await Attendance.findAll({
        where: {
          employee_id: {
            [Op.in]: employeeIds, // Match the employee IDs from the selected group
          },
          attendance_date: {
            [Op.gte]: startDate, // Start date of the month
            [Op.lte]: endDate, // End date of the month
          },
        },
      });
  
      // Add reporting_group to each attendance record
      const attendanceWithGroups = attendanceData.map(attendance => {
        const attendanceObj = attendance.toJSON(); // Convert to plain object if using Sequelize
        attendanceObj.reporting_group = employeeGroupMap[attendance.employee_id] || null;
        return attendanceObj;
      });
  
      // Return the attendance data with reporting groups
      return attendanceWithGroups;
  
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      throw error; // Throw error to be handled by the caller
    }
  }

module.exports = { getEmployeesByGroup, getEmployeesAttendanceByMonthAndGroup };
