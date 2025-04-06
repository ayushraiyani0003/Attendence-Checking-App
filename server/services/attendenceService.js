// getEmployeesByGroup.js
const { Op } = require('sequelize');  // Import Op from sequelize
const { Employee, Attendance, Audit, AttendanceDateLockStatus } = require('../models'); // Assuming Employee and Attendance models are defined

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
      const attendanceObj = attendance.get({ plain: true }); // Using get({ plain: true }) instead of toJSON()
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

// get all employee details for selected dates from redis for update the data.
async function updateEmployeesDetailsFromRedis(redisAttendanceData, user) {
  try {
    // Prepare to store audit logs
    const auditLogs = [];
    
    // Check if redisAttendanceData is iterable
    if (!Array.isArray(redisAttendanceData)) {
      throw new TypeError('redisAttendanceData must be an array');
    }
    
    console.log(`Processing ${redisAttendanceData.length} group records from Redis`);
    
    // Iterate through each group's data in Redis
    for (const redisGroup of redisAttendanceData) {
      // Ensure we have valid data
      if (!redisGroup.data) {
        console.warn('Skipping Redis group with no data:', redisGroup);
        continue;
      }
      
      // Parse the data from string to JSON if needed
      let attendanceRecords;
      try {
        attendanceRecords = typeof redisGroup.data === 'string' 
          ? JSON.parse(redisGroup.data) 
          : redisGroup.data;
          
        if (!Array.isArray(attendanceRecords)) {
          console.warn('Attendance records is not an array, skipping:', redisGroup);
          continue;
        }
        
        console.log(`Processing ${attendanceRecords.length} attendance records for group ${redisGroup.group}`);
      } catch (parseError) {
        console.error('Error parsing Redis data:', parseError);
        console.error('Problematic data:', redisGroup.data);
        continue;
      }
      
      // Process each attendance record
      for (const redisRecord of attendanceRecords) {
        // Find existing MySQL record
        const existingRecord = await Attendance.findOne({
          where: {
            employee_id: redisRecord.employee_id,
            attendance_date: redisRecord.attendance_date
          }
        });
        
        // Check if the record needs updating
        const needsUpdate = !existingRecord ||
          existingRecord.shift_type !== redisRecord.shift_type ||
          existingRecord.network_hours !== redisRecord.network_hours ||
          existingRecord.overtime_hours !== redisRecord.overtime_hours ||
          existingRecord.comment !== redisRecord.comment;
          
        if (needsUpdate) {
          // Prepare audit log
          const auditLog = {
            table_name: 'Attendance',
            action: existingRecord ? 'UPDATE' : 'CREATE',
            changed_by: user.username,
            old_data: existingRecord ? JSON.stringify({
              shift_type: existingRecord.shift_type,
              network_hours: existingRecord.network_hours,
              overtime_hours: existingRecord.overtime_hours,
              comment: existingRecord.comment
            }) : null,
            new_data: JSON.stringify({
              shift_type: redisRecord.shift_type,
              network_hours: redisRecord.network_hours,
              overtime_hours: redisRecord.overtime_hours,
              comment: redisRecord.comment
            })
          };
          
          // Update or create record
          if (existingRecord) {
            await existingRecord.update({
              shift_type: redisRecord.shift_type,
              network_hours: redisRecord.network_hours,
              overtime_hours: redisRecord.overtime_hours,
              comment: redisRecord.comment || existingRecord.comment // Preserve comment if not provided
            });
          } else {
            await Attendance.create({
              employee_id: redisRecord.employee_id,
              attendance_date: redisRecord.attendance_date,
              shift_type: redisRecord.shift_type,
              network_hours: redisRecord.network_hours,
              overtime_hours: redisRecord.overtime_hours,
              comment: redisRecord.comment || null
            });
          }
          
          // Add to audit logs
          auditLogs.push(auditLog);
        }
      }
      
      try{
      // Update lock status for the reporting groups
      if (user.userReportingGroup && user.userReportingGroup.length > 0) {
        // Find the group name for the current Redis data
        const groupName = redisGroup.group;
        
        // Check if the group is in user's reporting groups
        if (user.userReportingGroup.includes(groupName)) {
          // Update lock status for the specific date and group
          await AttendanceDateLockStatus.update(
            {
              status: 'locked',
              locked_by: user.username
            },
            {
              where: {
                reporting_group_name: groupName,
                attendance_date: redisGroup.date
              }
            }
          );
        }
    }
  console.log("scucssesfully changed");
  
  }catch {
      console.log("Error updating lock status");
    }
    }
    
    // Bulk create audit logs if any
    if (auditLogs.length > 0) {
      await Audit.bulkCreate(auditLogs);
    }
    
    return {
      success: true,
      updatedRecords: auditLogs.length
    };
  } catch (error) {
    console.error('Error updating employees details:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// data fetch from mysql attendance data only using the reporting_group and date
async function getAttendanceSelectedGroupDateMysql(reportingGroups, attendanceDate) {
  try {
    // Ensure reportingGroups is an array
    const groupList = Array.isArray(reportingGroups) ? reportingGroups : [reportingGroups];

    // Validate date input
    const validatedDate = new Date(attendanceDate);
    if (isNaN(validatedDate.getTime())) {
      throw new Error('Invalid date provided');
    }

    // Format the date to match MySQL date format (YYYY-MM-DD)
    const formattedDate = validatedDate.toISOString().split('T')[0];

    // First, fetch employees in the specified reporting groups
    const employees = await Employee.findAll({
      where: {
        reporting_group: {
          [Op.in]: groupList
        }
      },
      attributes: ['employee_id', 'name', 'reporting_group']
    });

    // Extract employee IDs
    const employeeIds = employees.map(emp => emp.employee_id);

    // Then, fetch attendance records for these employees
    const attendanceRecords = await Attendance.findAll({
      where: {
        employee_id: {
          [Op.in]: employeeIds
        },
        attendance_date: formattedDate
      },
      attributes: [
        'attendance_id', 
        'employee_id', 
        'attendance_date', 
        'shift_type', 
        'network_hours', 
        'overtime_hours',
        'comment' // Added comment field
      ]
    });

    // Create a map of employees for quick lookup
    const employeeMap = employees.reduce((map, emp) => {
      map[emp.employee_id] = emp;
      return map;
    }, {});

    // Transform the records to include employee details
    const transformedRecords = attendanceRecords.map(record => {
      const employee = employeeMap[record.employee_id];
      return {
        ...record.get({ plain: true }), // Using get({ plain: true }) instead of toJSON()
        reporting_group: employee ? employee.reporting_group : null,
        employee_name: employee ? employee.name : 'Unknown'
      };
    });

    // Return the formatted result
    return {
      date: formattedDate,
      groups: groupList,
      totalRecords: transformedRecords.length,
      records: transformedRecords
    };
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    throw error;
  }
}

// update the attendance from redis to mysql but only need redis data.
async function updateAttendanceFromRedisBySystumn(redisAttendanceData) {
  try {
    // Prepare to store audit logs
    const auditLogs = [];
    const groupsToLock = new Set();
    let totalCheckedRecords = 0;
    let totalUpdatedRecords = 0;

    // Iterate through each group's data in Redis
    for (const redisGroup of redisAttendanceData) {
      // Extract the group and date from the key (format: attendance:groupName:date)
      const [_, groupName, attendanceDate] = redisGroup.key.split(':');
      
      // Add group and date to lock tracking
      groupsToLock.add({ groupName, attendanceDate });

      // Extract attendance records from the Redis group
      const attendanceRecords = redisGroup.attendance;

      // Process each attendance record
      for (const redisRecord of attendanceRecords) {
        totalCheckedRecords++;

        // Ensure redisRecord is an object and has necessary properties
        if (typeof redisRecord !== 'object' || !redisRecord.employee_id) {
          console.warn(`Skipping invalid record in group ${groupName}:`, redisRecord);
          continue;
        }

        // Find existing MySQL record
        const existingRecord = await Attendance.findOne({ 
          where: { 
            employee_id: redisRecord.employee_id, 
            attendance_date: attendanceDate 
          } 
        });

        // Check if the record needs updating (fields comparison)
        const needsUpdate = !existingRecord || 
          (existingRecord.shift_type !== redisRecord.shift_type) || 
          (existingRecord.network_hours !== redisRecord.network_hours) || 
          (existingRecord.overtime_hours !== redisRecord.overtime_hours) ||
          (existingRecord.comment !== redisRecord.comment); // Added comment check

        if (needsUpdate) {
          // Prepare audit log
          const auditLog = {
            table_name: 'Attendance',
            action: existingRecord ? 'UPDATE' : 'CREATE',
            changed_by: 'system',
            old_data: existingRecord ? JSON.stringify({
              shift_type: existingRecord.shift_type,
              network_hours: existingRecord.network_hours,
              overtime_hours: existingRecord.overtime_hours,
              comment: existingRecord.comment
            }) : null,
            new_data: JSON.stringify({
              shift_type: redisRecord.shift_type,
              network_hours: redisRecord.network_hours,
              overtime_hours: redisRecord.overtime_hours,
              comment: redisRecord.comment
            })
          };

          // Update or create record in MySQL
          if (existingRecord) {
            await existingRecord.update({
              shift_type: redisRecord.shift_type,
              network_hours: redisRecord.network_hours,
              overtime_hours: redisRecord.overtime_hours,
              comment: redisRecord.comment || existingRecord.comment // Keep existing comment if not provided
            });
          } else {
            await Attendance.create({
              employee_id: redisRecord.employee_id,
              attendance_date: attendanceDate,
              shift_type: redisRecord.shift_type,
              network_hours: redisRecord.network_hours,
              overtime_hours: redisRecord.overtime_hours,
              comment: redisRecord.comment || null
            });
          }

          // Add to audit logs
          auditLogs.push(auditLog);
          totalUpdatedRecords++;
        }
      }
    }

    // Update lock status for all unique groups and dates
    const lockPromises = Array.from(groupsToLock).map(({ groupName, attendanceDate }) => 
      AttendanceDateLockStatus.update(
        { 
          status: 'locked', 
          locked_by: 'system' 
        },
        { 
          where: { 
            reporting_group_name: groupName,
            attendance_date: attendanceDate
          } 
        }
      )
    );
    await Promise.all(lockPromises);

    // Bulk create audit logs if any
    if (auditLogs.length > 0) {
      await Audit.bulkCreate(auditLogs);
    }

    return { 
      success: true, 
      checkedRecords: totalCheckedRecords,
      updatedRecords: totalUpdatedRecords,
      auditLogs: auditLogs.length
    };
  } catch (error) {
    console.error('Error updating employees details:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Add attendance record to MySQL (Attendance table)
const addAttendanceToMySQL = async (attendanceData) => {
  try {
    // Ensure required fields are present
    if (!attendanceData.employee_id || !attendanceData.attendance_date) {
      return {
        success: false,
        error: 'Missing required fields: employee_id and attendance_date are required'
      };
    }

    // Check if a record already exists
    const existingRecord = await Attendance.findOne({
      where: {
        employee_id: attendanceData.employee_id,
        attendance_date: attendanceData.attendance_date
      }
    });

    let result;
    
    // If record exists, update it
    if (existingRecord) {
      await existingRecord.update({
        shift_type: attendanceData.shift_type || existingRecord.shift_type,
        network_hours: attendanceData.network_hours || existingRecord.network_hours,
        overtime_hours: attendanceData.overtime_hours || existingRecord.overtime_hours,
        comment: attendanceData.comment || existingRecord.comment
      });
      result = existingRecord;
    } else {
      // Create new record
      result = await Attendance.create({
        employee_id: attendanceData.employee_id,
        attendance_date: attendanceData.attendance_date,
        shift_type: attendanceData.shift_type || null,
        network_hours: attendanceData.network_hours || null,
        overtime_hours: attendanceData.overtime_hours || null,
        comment: attendanceData.comment || null
      });
    }

    // Create audit log
    await Audit.create({
      table_name: 'Attendance',
      action: existingRecord ? 'UPDATE' : 'CREATE',
      changed_by: attendanceData.user_id || 'system',
      old_data: existingRecord ? JSON.stringify({
        shift_type: existingRecord.shift_type,
        network_hours: existingRecord.network_hours,
        overtime_hours: existingRecord.overtime_hours,
        comment: existingRecord.comment
      }) : null,
      new_data: JSON.stringify({
        shift_type: attendanceData.shift_type,
        network_hours: attendanceData.network_hours,
        overtime_hours: attendanceData.overtime_hours,
        comment: attendanceData.comment
      })
    });

    return {
      success: true,
      data: result,
      action: existingRecord ? 'updated' : 'created'
    };
  } catch (error) {
    console.error('Error adding/updating attendance to MySQL:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = { 
  getEmployeesByGroup, 
  getEmployeesAttendanceByMonthAndGroup, 
  updateEmployeesDetailsFromRedis, 
  getAttendanceSelectedGroupDateMysql,
  updateAttendanceFromRedisBySystumn,
  addAttendanceToMySQL
};