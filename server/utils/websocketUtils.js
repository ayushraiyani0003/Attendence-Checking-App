// utils/websocketUtils.js
const { Employee, Attendance, AttendanceDateLockStatus } = require('../models');
const { Sequelize, Op } = require('sequelize');
const WebSocket = require('ws');
const moment = require('moment');

module.exports = {
  initWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
      console.log('A client connected to WebSocket');
      
      ws.on('message', async (message) => {
        const data = JSON.parse(message);
        console.log(data);
        
        if (data.action === 'getAttendance') {
          const { group, month, user } = data;
          const userRole = user?.role || 'user';

          // Parse the month into a valid date string (e.g., 'Mar 2025' -> '2025-03-01')
          const startDate = moment(`${month}-01`, 'MMM YYYY-DD').format('YYYY-MM-DD');
          const endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');
          
          // Fetch the list of all reporting groups (we assume it's a list of groups)
          const reportingGroups = Array.isArray(group) ? group : [group];  // Handle multiple groups if needed

          const attendanceData = [];
          const lockStatusData = [];

          // Generate all dates of the selected month
          const dateArray = [];
          let currentDate = moment(startDate);

          // Generate all the dates in the selected month
          while (currentDate.isBefore(moment(endDate).add(1, 'days'), 'day')) {
            dateArray.push(currentDate.format('YYYY-MM-DD'));  // Add formatted date to the array
            currentDate.add(1, 'days'); // Move to the next day
          }

          // Fetch all lock statuses for the generated dates in the selected month
          for (let groupName of reportingGroups) {
            const lockStatusForGroup = await AttendanceDateLockStatus.findAll({
              where: {
                attendance_date: {
                  [Op.in]: dateArray, // For all dates in the selected month
                },
                reporting_group_name: groupName, // Only for the selected group
              },
            });

            lockStatusForGroup.forEach((status) => {
              lockStatusData.push({
                date: status.attendance_date,  // Date for the status
                reported_group: status.reporting_group_name,  // Group name
                status: status.status || 'unlocked',  // Default to 'unlocked'
              });
            });
          }
          
          // Create a map for quick lock status lookups
          const lockStatusMap = {};
          lockStatusData.forEach((status) => {
            lockStatusMap[status.date] = status.status;
          });

          // Fetch the list of all employees based on the user group
          const employees = await Employee.findAll({
            where: { reporting_group: { [Op.in]: reportingGroups } },
            attributes: ['employee_id', 'name', 'department', 'punch_code', 'designation', 'reporting_group'],
          });

          // Fetch attendance data for each employee for the selected month
          for (const employee of employees) {
            const attendance = await Attendance.findAll({
              where: {
                employee_id: employee.employee_id,
                attendance_date: {
                  [Op.between]: [startDate, endDate],
                },
              },
            });

            const attendanceWithLockStatus = [];

            // For each attendance record, fetch lock/unlock status
            for (const att of attendance) {
              const lockStatus = lockStatusMap[att.attendance_date] || 'unlocked'; // Use the lock status from the map or default to 'unlocked'

              attendanceWithLockStatus.push({
                date: att.attendance_date,  // Store the date of the attendance
                day: moment(att.attendance_date).format('dddd'), // Get the day of the week (e.g., 'Monday')
                netHR: att.network_hours || '0',  // Net hours or default to '0'
                otHR: att.overtime_hours || '0',  // Overtime hours or default to '0'
                dnShift: att.shift_type || 'Off', // Shift type (e.g., 'Night' or 'Off')
                lock_status: lockStatus, // Use the lock/unlock status from the map
              });
            }

            // Combine employee info with attendance data
            attendanceData.push({
              id: employee.employee_id.toString(),  // Use employee ID
              punchCode: employee.punch_code,
              name: employee.name,
              designation: employee.designation,
              department: employee.department,
              attendance: attendanceWithLockStatus,  // Include the attendance records with lock status
            });
          }

          // Send both the attendance data and lock status data to the client
          ws.send(JSON.stringify({
            action: 'attendanceData',
            userRole,
            attendance: attendanceData,
            lockStatus: lockStatusData,  // Include the lock status data in the response
          }));
        }
      });

      ws.on('close', () => {
        console.log('A client disconnected');
      });
    });
  },
};