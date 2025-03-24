const { Employee, Attendance } = require("../models"); // Assuming you have exported models for Employee and Attendance

// Function to generate daily attendance for all employees
const generateDailyAttendance = async () => {
  try {
    // Get the current date
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Get all employees
    const employees = await Employee.findAll();

    // Loop through each employee and create an attendance record
    for (const employee of employees) {
      await Attendance.create({
        employee_id: employee.employee_id,
        attendance_date: currentDate,
        shift_type: 'D', // Default or update this as needed
        network_hours: 0, // Default or update based on your requirement
        overtime_hours: 0, // Default or update based on your requirement
      });
    }

    console.log('Attendance records generated for all employees!');
  } catch (error) {
    console.error('Error generating daily attendance:', error);
  }
};

module.exports = { generateDailyAttendance };
