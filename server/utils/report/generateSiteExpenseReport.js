const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

/**
 * Generate site expense report based on various parameters
 * @param {Array} finalAttendanceData - Attendance data records
 * @param {Array} metricsData - Metrics data records 
 * @param {number} month - Month number (1-12)
 * @param {number} year - Year (e.g., 2025)
 * @param {string} option - Report options: "count", "hours", "remarks", or combinations
 * @param {Array<string>} dateRange - Date range in format ['Mon, 31 Mar 2025 23:00:00 GMT', 'Sun, 06 Apr 2025 23:00:00 GMT']
 * @param {string} employeeType - "All Employees", "Faulty Employees", or "New Employees"
 * @param {Array} employeeDetails - Employee details records
 * @returns {Promise<string>} - Path to the generated Excel file
 */
async function generateSiteExpenseReport(finalAttendanceData, metricsData, month, year, option, dateRange, employeeType, employeeDetails) {
  // Debug parameters
  console.log("=========== STARTING REPORT GENERATION ===========");
  console.log("Parameters received:");
  console.log(`Month: ${month}, Year: ${year}`);
  console.log(`Option: ${option}`);
  console.log(`Date Range: ${JSON.stringify(dateRange)}`);
  console.log(`Employee Type: ${employeeType}`);
  console.log(`Attendance Data: ${finalAttendanceData.length} records`);
  console.log(`Metrics Data: ${metricsData.length} records`);
  console.log(`Employee Details: ${employeeDetails.length} records`);
  
  // Create Excel workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Site Expense Report');
  
  // Parse date range
  const startDate = moment(dateRange[0]);
  const endDate = moment(dateRange[1]);
  console.log(`Parsed Date Range: ${startDate.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`);
  
  // Debug: Show some attendance data samples
  if (finalAttendanceData.length > 0) {
    console.log("Sample attendance records:");
    finalAttendanceData.slice(0, 3).forEach(record => console.log(JSON.stringify(record)));
    
    // Check for site comments in attendance data
    const siteComments = finalAttendanceData.filter(a => 
      a.comment && (
        a.comment.toLowerCase().trim().startsWith("site") || 
        a.comment.toLowerCase().includes("site")
      )
    );
    console.log(`Found ${siteComments.length} attendance records with site comments`);
    if (siteComments.length > 0) {
      console.log("Sample site comments:");
      siteComments.slice(0, 3).forEach(record => {
        console.log(`Employee ID: ${record.employee_id}, Comment: "${record.comment}"`);
      });
    }
  } else {
    console.log("WARNING: No attendance data found!");
  }
  
  // Debug: Show some metrics data samples
  if (metricsData.length > 0) {
    console.log("Sample metrics records:");
    metricsData.slice(0, 2).forEach(record => {
      const dataValues = record.dataValues || record;
      console.log(JSON.stringify(dataValues));
    });
  } else {
    console.log("WARNING: No metrics data found!");
  }
  
  // Debug: Show some employee data samples
  if (employeeDetails.length > 0) {
    console.log("Sample employee records:");
    employeeDetails.slice(0, 3).forEach(emp => {
      const dataValues = emp.dataValues || emp;
      console.log(JSON.stringify(dataValues));
    });
  } else {
    console.log("WARNING: No employee data found!");
  }
  
  // Filter employees based on employeeType
  console.log(`Filtering employees by type: ${employeeType}`);
  let filteredEmployees = filterEmployeesByType(employeeDetails, employeeType, finalAttendanceData, metricsData);
  console.log(`After type filtering: ${filteredEmployees.length} employees`);
  
  // Filter employees who have site in comment at least once
  console.log("Filtering employees with site visits...");
  filteredEmployees = filterEmployeesWithSiteVisits(filteredEmployees, finalAttendanceData);
  console.log(`After site visit filtering: ${filteredEmployees.length} employees`);
  
  if (filteredEmployees.length === 0) {
    console.log("No employees match the criteria. Creating empty report.");
    return createEmptyReport(option, startDate, endDate, employeeType, workbook);
  }
  
  // Create date headers based on date range
  const dateHeaders = generateDateHeaders(startDate, endDate);
  console.log(`Generated ${dateHeaders.length} date headers: ${dateHeaders.join(', ')}`);
  
  // Continue with report generation...
  console.log("Setting up worksheet headers...");
  setupWorksheetHeaders(worksheet, dateHeaders, option);
  
  console.log("Populating data rows...");
  populateDataRows(worksheet, filteredEmployees, finalAttendanceData, metricsData, dateHeaders, option);
  
  console.log("Adding totals row...");
  addTotalsRow(worksheet, filteredEmployees.length, dateHeaders.length, option);
  
  console.log("Styling worksheet...");
  styleWorksheet(worksheet, option, dateHeaders.length);
  
  // Create the directory if it doesn't exist
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Generate filename based on parameters
  const startDateStr = startDate.format('YYYY-MM-DD');
  const endDateStr = endDate.format('YYYY-MM-DD');
  const sanitizedEmployeeType = typeof employeeType === 'string' ? employeeType.replace(/\s+/g, '') : 'AllEmployees';
  const sanitizedOption = typeof option === 'string' ? option.replace(/\s+/g, '') : 'default';
  const filename = `SiteExpenseReport_${startDateStr}_to_${endDateStr}_${sanitizedEmployeeType}_${sanitizedOption}.xlsx`;
  const filePath = path.join(reportsDir, filename);
  
  console.log(`Saving report to: ${filePath}`);
  // Save the workbook
  await workbook.xlsx.writeFile(filePath);
  
  console.log("Report generation completed successfully.");
  return filePath;
}

/**
 * Get attendance data for the specified date range
 * @param {moment} startDate - Start date
 * @param {moment} endDate - End date
 * @returns {Promise<Array>} - Attendance data
 */
async function getAttendanceData(startDate, endDate) {
  try {
    console.log("Inside getAttendanceData function");
    // This function should be implemented to fetch attendance data from your data source
    
    // If you're using Sequelize, your implementation might look like:
    // const records = await AttendanceModel.findAll({
    //   where: {
    //     attendance_date: {
    //       [Op.between]: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
    //     }
    //   }
    // });
    
    // For debugging, let's log how we would access your data source
    console.log(`Attempting to fetch attendance data between ${startDate.format('YYYY-MM-DD')} and ${endDate.format('YYYY-MM-DD')}`);
    
    // Since we don't have your actual DB connection, log instructions for you
    console.log("ACTION REQUIRED: Replace this placeholder with your actual database query");
    console.log("Example: const records = await AttendanceModel.findAll({ ... });");
    
    // Return empty array or placeholder data for now
    // IMPORTANT: Replace this with your actual implementation
    return []; // Replace with actual implementation
  } catch (error) {
    console.error("Error in getAttendanceData:", error);
    // Return empty array in case of error
    return [];
  }
}

/**
 * Get metrics data for the specified month and year
 * @param {number} month - Month number
 * @param {number} year - Year
 * @returns {Promise<Array>} - Metrics data
 */
async function getMetricsData(month, year) {
  try {
    console.log("Inside getMetricsData function");
    console.log(`Attempting to fetch metrics data for ${year}-${month}`);
    
    // For debugging, print how you'd normally access this data
    const monthYearString = `${year}-${String(month).padStart(2, '0')}`;
    console.log(`Looking for month_year = ${monthYearString}`);
    
    // If you're using Sequelize, your implementation might look like:
    // const records = await MetricsModel.findAll({
    //   where: {
    //     month_year: monthYearString
    //   }
    // });
    
    console.log("ACTION REQUIRED: Replace this placeholder with your actual database query");
    console.log("Example: const records = await MetricsModel.findAll({ ... });");
    
    // Return empty array or placeholder data for now
    // IMPORTANT: Replace this with your actual implementation
    return []; // Replace with actual implementation
  } catch (error) {
    console.error("Error in getMetricsData:", error);
    // Return empty array in case of error
    return [];
  }
}

/**
 * Get employee details
 * @returns {Promise<Array>} - Employee details
 */
async function getEmployeeDetails() {
  try {
    console.log("Inside getEmployeeDetails function");
    
    // If you're using Sequelize, your implementation might look like:
    // const employees = await EmployeeModel.findAll({
    //   where: {
    //     status: 'active'
    //   }
    // });
    
    console.log("ACTION REQUIRED: Replace this placeholder with your actual database query");
    console.log("Example: const employees = await EmployeeModel.findAll({ ... });");
    
    // Return empty array or placeholder data for now
    // IMPORTANT: Replace this with your actual implementation
    return []; // Replace with actual implementation
  } catch (error) {
    console.error("Error in getEmployeeDetails:", error);
    // Return empty array in case of error
    return [];
  }
}

/**
 * Filter employees based on employeeType
 * @param {Array} employees - Employee details
 * @param {string} employeeType - Type of employees to filter
 * @param {Array} attendanceData - Attendance data
 * @param {Array} metricsData - Metrics data
 * @returns {Array} - Filtered employees
 */
function filterEmployeesByType(employees, employeeType, attendanceData, metricsData) {
  console.log(`Filtering employees by type: "${employeeType}"`);
  
  if (!employeeType || employeeType === "All Employees") {
    console.log("Returning all employees without filtering by type");
    return employees;
  } else if (employeeType === "Faulty Employees") {
    console.log("Filtering for employees with discrepancies > 0.25 hours");
    return employees.filter(employee => {
      // Get employee data, handling both direct objects and Sequelize objects
      const employeeData = employee.dataValues || employee;
      const employeeId = employeeData.employee_id;
      const punchCode = employeeData.punch_code;
      
      console.log(`Checking employee ID ${employeeId} with punch code ${punchCode}`);
      
      const employeeAttendance = attendanceData.filter(a => a.employee_id === employeeId);
      
      if (employeeAttendance.length === 0) {
        console.log(`No attendance records found for employee ID ${employeeId}`);
        return false;
      }
      
      // Find metrics for this employee
      const employeeMetrics = metricsData.find(m => {
        const metricsData = m.dataValues || m;
        return metricsData.punch_code === punchCode;
      });
      
      if (!employeeMetrics) {
        console.log(`No metrics found for employee ID ${employeeId} with punch code ${punchCode}`);
        return false;
      }
      
      // Check if there's any discrepancy greater than 0.25 in OT or network hours
      for (const attendance of employeeAttendance) {
        const attendanceDate = moment(attendance.attendance_date).format('DD');
        const metricsDataValues = employeeMetrics.dataValues || employeeMetrics;
        const networkHoursFromMetrics = getHoursFromMetricsJson(metricsDataValues.network_hours, attendanceDate);
        const otHoursFromMetrics = getHoursFromMetricsJson(metricsDataValues.overtime_hours, attendanceDate);
        
        const networkHoursDiff = Math.abs(attendance.network_hours - networkHoursFromMetrics);
        const otHoursDiff = Math.abs(attendance.overtime_hours - otHoursFromMetrics);
        
        console.log(`Employee ${employeeId} on date ${attendanceDate}:`);
        console.log(`  Network hours: Actual=${attendance.network_hours}, Expected=${networkHoursFromMetrics}, Diff=${networkHoursDiff}`);
        console.log(`  OT hours: Actual=${attendance.overtime_hours}, Expected=${otHoursFromMetrics}, Diff=${otHoursDiff}`);
        
        if (networkHoursDiff > 0.25 || otHoursDiff > 0.25) {
          console.log(`  Employee ${employeeId} has discrepancy > 0.25, including in filtered list`);
          return true;
        }
      }
      
      console.log(`No discrepancies found for employee ${employeeId}, excluding from filtered list`);
      return false;
    });
  } else if (employeeType === "New Employees") {
    console.log("Filtering for employees with 'new' in punch code");
    return employees.filter(employee => {
      const employeeData = employee.dataValues || employee;
      const punchCode = employeeData.punch_code;
      const matches = punchCode.toLowerCase().includes("new");
      if (matches) {
        console.log(`Employee ID ${employeeData.employee_id} with punch code ${punchCode} matches 'new' criteria`);
      }
      return matches;
    });
  }
  
  console.log(`Unknown employee type: "${employeeType}", returning all employees`);
  return employees;
}

/**
 * Get hours from metrics JSON for a specific date
 * @param {string} hoursJson - JSON string of hours
 * @param {string} date - Date in DD format
 * @returns {number} - Hours for the date
 */
function getHoursFromMetricsJson(hoursJson, date) {
  try {
    // Handle both string and already parsed JSON object
    let hoursData;
    if (typeof hoursJson === 'string') {
      hoursData = JSON.parse(hoursJson);
    } else if (Array.isArray(hoursJson)) {
      hoursData = hoursJson;
    } else {
      console.error("Invalid hours data format:", hoursJson);
      return 0;
    }
    
    const dateEntry = hoursData.find(entry => entry.date === date);
    const hours = dateEntry ? parseFloat(dateEntry.hours) : 0;
    
    console.log(`For date ${date}, found hours: ${hours} from metrics data`);
    return hours;
  } catch (error) {
    console.error(`Error parsing metrics JSON for date ${date}:`, error);
    console.error(`Raw JSON data: ${JSON.stringify(hoursJson)}`);
    return 0;
  }
}

/**
 * Filter employees who have site in comment at least once
 * @param {Array} employees - Employee details
 * @param {Array} attendanceData - Attendance data
 * @returns {Array} - Filtered employees
 */
/**
 * Filter employees who have site in comment at least once
 * @param {Array} employees - Employee details
 * @param {Array} attendanceData - Attendance data
 * @returns {Array} - Filtered employees
 */
function filterEmployeesWithSiteVisits(employees, attendanceData) {
  // Debug information
  console.log(`Total employees before filtering: ${employees.length}`);
  console.log(`Total attendance records: ${attendanceData.length}`);
  
  // For debugging, check if any comments have "site" in them
  const siteComments = attendanceData.filter(a => 
    a.comment && (
      a.comment.toLowerCase().trim().startsWith("site") || 
      a.comment.toLowerCase().includes("site")
    )
  );
  console.log(`Attendance records with site comments: ${siteComments.length}`);
  
  if (siteComments.length > 0) {
    console.log("Sample site comments:");
    siteComments.slice(0, 3).forEach(a => {
      console.log(`Comment: "${a.comment}" for employee ID: ${a.employee_id}`);
    });
  }
  
  return employees.filter(employee => {
    // Get employee ID, handling both direct objects and Sequelize objects
    const employeeId = employee.dataValues ? employee.dataValues.employee_id : employee.employee_id;
    
    // Filter attendance records for this employee
    const employeeAttendance = attendanceData.filter(a => 
      a.employee_id === employeeId
    );
    
    console.log(`Employee ID ${employeeId} has ${employeeAttendance.length} attendance records`);
    
    // Check for site comments but be more flexible in matching
    const hasSiteVisit = employeeAttendance.some(attendance => 
      attendance.comment && (
        attendance.comment.toLowerCase().trim().startsWith("site") || 
        attendance.comment.toLowerCase().includes("site")
      )
    );
    
    if (hasSiteVisit) {
      console.log(`Employee ID ${employeeId} has site visits`);
      // Show the matching comments for debugging
      const siteVisits = employeeAttendance.filter(attendance => 
        attendance.comment && (
          attendance.comment.toLowerCase().trim().startsWith("site") || 
          attendance.comment.toLowerCase().includes("site")
        )
      );
      siteVisits.forEach(visit => {
        console.log(`  - Date: ${visit.attendance_date}, Comment: "${visit.comment}"`);
      });
    }
    
    return hasSiteVisit;
  });
}

/**
 * Create an empty report when no data is available
 * @param {string} option - Report option
 * @param {moment} startDate - Start date
 * @param {moment} endDate - End date
 * @param {string} employeeType - Employee type
 * @param {ExcelJS.Workbook} workbook - Excel workbook
 * @returns {Promise<string>} - Path to the generated Excel file
 */
async function createEmptyReport(option, startDate, endDate, employeeType, workbook) {
  const worksheet = workbook.getWorksheet('Site Expense Report');
  
  worksheet.addRow(['No data available for the selected criteria']);
  
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const startDateStr = startDate.format('YYYY-MM-DD');
  const endDateStr = endDate.format('YYYY-MM-DD');
  const sanitizedEmployeeType = typeof employeeType === 'string' ? employeeType.replace(/\s+/g, '') : 'AllEmployees';
  const sanitizedOption = typeof option === 'string' ? option.replace(/\s+/g, '') : 'default';
  const filename = `SiteExpenseReport_${startDateStr}_to_${endDateStr}_${sanitizedEmployeeType}_${sanitizedOption}_empty.xlsx`;
  const filePath = path.join(reportsDir, filename);
  
  await workbook.xlsx.writeFile(filePath);
  
  return filePath;
}

/**
 * Generate date headers based on date range
 * @param {moment} startDate - Start date
 * @param {moment} endDate - End date
 * @returns {Array} - Array of date strings in DD-MM format
 */
function generateDateHeaders(startDate, endDate) {
  const dateHeaders = [];
  const currentDate = startDate.clone();
  
  while (currentDate.isSameOrBefore(endDate)) {
    dateHeaders.push(currentDate.format('DD-MM'));
    currentDate.add(1, 'day');
  }
  
  return dateHeaders;
}

/**
 * Setup worksheet headers based on options
 * @param {ExcelJS.Worksheet} worksheet - Excel worksheet
 * @param {Array} dateHeaders - Date headers
 * @param {string} option - Report option
 */
function setupWorksheetHeaders(worksheet, dateHeaders, option) {
  // Add employee details header
  let headerRow = ['Employee ID', 'Name', 'Punch Code', 'Department'];
  
  // Add date headers based on option
  for (const date of dateHeaders) {
    if (option === "count") {
      headerRow.push(date);
    } else if (option === "hours") {
      headerRow.push(`${date} Net Hr`);
      headerRow.push(`${date} OT Hr`);
    } else if (option === "remarks") {
      headerRow.push(`${date} Net Hr`);
      headerRow.push(`${date} OT Hr`);
      headerRow.push(`${date} Remarks`);
    } else if (option === "count and remarks") {
      headerRow.push(`${date} Count`);
      headerRow.push(`${date} Remarks`);
    } else {
      // Default to hours and remarks
      headerRow.push(`${date} Net Hr`);
      headerRow.push(`${date} OT Hr`);
      headerRow.push(`${date} Remarks`);
    }
  }
  
  // Add total column
  headerRow.push('Total Net Hours');
  if (option === "hours" || option === "remarks" || option === "hours and remarks") {
    headerRow.push('Total OT Hours');
  }
  
  worksheet.addRow(headerRow);
  
  // Merge header cells for dates
  let colIndex = 5; // Start after employee details columns
  for (const date of dateHeaders) {
    if (option === "count") {
      // No merge needed for count only
    } else if (option === "hours") {
      worksheet.mergeCells(1, colIndex, 1, colIndex + 1);
      colIndex += 2;
    } else if (option === "remarks") {
      worksheet.mergeCells(1, colIndex, 1, colIndex + 2);
      colIndex += 3;
    } else if (option === "count and remarks") {
      worksheet.mergeCells(1, colIndex, 1, colIndex + 1);
      colIndex += 2;
    } else {
      // Default to hours and remarks
      worksheet.mergeCells(1, colIndex, 1, colIndex + 2);
      colIndex += 3;
    }
  }
  
  // Add subheaders for merged cells
  if (option !== "count") {
    let subHeaderRow = ['', '', '', ''];
    
    for (const date of dateHeaders) {
      if (option === "hours") {
        subHeaderRow.push('Net Hr');
        subHeaderRow.push('OT Hr');
      } else if (option === "remarks") {
        subHeaderRow.push('Net Hr');
        subHeaderRow.push('OT Hr');
        subHeaderRow.push('Remarks');
      } else if (option === "count and remarks") {
        subHeaderRow.push('Count');
        subHeaderRow.push('Remarks');
      } else {
        // Default to hours and remarks
        subHeaderRow.push('Net Hr');
        subHeaderRow.push('OT Hr');
        subHeaderRow.push('Remarks');
      }
    }
    
    subHeaderRow.push('');
    if (option === "hours" || option === "remarks" || option === "hours and remarks") {
      subHeaderRow.push('');
    }
    
    worksheet.addRow(subHeaderRow);
  }
}

/**
 * Populate data rows in the worksheet
 * @param {ExcelJS.Worksheet} worksheet - Excel worksheet
 * @param {Array} employees - Filtered employees
 * @param {Array} attendanceData - Attendance data
 * @param {Array} metricsData - Metrics data
 * @param {Array} dateHeaders - Date headers
 * @param {string} option - Report option
 */
function populateDataRows(worksheet, employees, attendanceData, metricsData, dateHeaders, option) {
  console.log(`Populating data rows for ${employees.length} employees with option: ${option}`);
  
  // Determine starting row based on option (accounting for headers)
  const startRow = option === "count" ? 2 : 3;
  
  employees.forEach((employee, index) => {
    // Handle both Sequelize objects and plain objects
    const employeeData = employee.dataValues || employee;
    const employeeId = employeeData.employee_id;
    const punchCode = employeeData.punch_code;
    
    console.log(`Adding row for employee ID: ${employeeId}, punch code: ${punchCode}`);
    
    const rowData = [
      employeeId,
      employeeData.name,
      punchCode,
      employeeData.department
    ];
    
    let totalNetHours = 0;
    let totalOTHours = 0;
    
    // Find metrics for this employee
    const employeeMetrics = metricsData.find(m => {
      const metricsData = m.dataValues || m;
      return metricsData.punch_code === punchCode;
    });
    
    if (employeeMetrics) {
      console.log(`Found metrics for employee ${employeeId}`);
    } else {
      console.log(`No metrics found for employee ${employeeId}`);
    }
    
    // Process each date
    for (const dateHeader of dateHeaders) {
      const [day, monthStr] = dateHeader.split('-');
      const month = parseInt(monthStr, 10);
      
      // Find attendance for this employee on this date
      const attendance = attendanceData.find(a => {
        const attendanceDate = moment(a.attendance_date);
        return a.employee_id === employeeId && 
               attendanceDate.date() === parseInt(day, 10) && 
               attendanceDate.month() + 1 === month;
      });
      
      if (attendance) {
        console.log(`Found attendance for employee ${employeeId} on ${dateHeader}`);
      }
      
      // Get expected hours from metrics
      let expectedNetHours = 0;
      let expectedOTHours = 0;
      
      if (employeeMetrics) {
        const metricsDataValues = employeeMetrics.dataValues || employeeMetrics;
        expectedNetHours = getHoursFromMetricsJson(metricsDataValues.network_hours, day);
        expectedOTHours = getHoursFromMetricsJson(metricsDataValues.overtime_hours, day);
      }
      
      // Handle different report options
      if (option === "count") {
        const hasSiteVisit = attendance && attendance.comment && 
          (attendance.comment.toLowerCase().trim().startsWith("site") || 
           attendance.comment.toLowerCase().includes("site"));
        rowData.push(hasSiteVisit ? 1 : 0);
      } else if (option === "hours") {
        const netHours = attendance ? attendance.network_hours || 0 : 0;
        const otHours = attendance ? attendance.overtime_hours || 0 : 0;
        
        totalNetHours += netHours;
        totalOTHours += otHours;
        
        // Add the cell values
        rowData.push(netHours);
        rowData.push(otHours);
      } else if (option === "remarks") {
        const netHours = attendance ? attendance.network_hours || 0 : 0;
        const otHours = attendance ? attendance.overtime_hours || 0 : 0;
        const remark = attendance && attendance.comment ? attendance.comment : '';
        
        totalNetHours += netHours;
        totalOTHours += otHours;
        
        rowData.push(netHours);
        rowData.push(otHours);
        rowData.push(remark);
      } else if (option === "count and remarks") {
        const hasSiteVisit = attendance && attendance.comment && 
          (attendance.comment.toLowerCase().trim().startsWith("site") || 
           attendance.comment.toLowerCase().includes("site"));
        const remark = attendance && attendance.comment ? attendance.comment : '';
        
        rowData.push(hasSiteVisit ? 1 : 0);
        rowData.push(remark);
      } else {
        // Default to hours and remarks
        const netHours = attendance ? attendance.network_hours || 0 : 0;
        const otHours = attendance ? attendance.overtime_hours || 0 : 0;
        const remark = attendance && attendance.comment ? attendance.comment : '';
        
        totalNetHours += netHours;
        totalOTHours += otHours;
        
        rowData.push(netHours);
        rowData.push(otHours);
        rowData.push(remark);
      }
    }
    
    // Add total columns
    rowData.push(totalNetHours);
    if (option === "hours" || option === "remarks" || option === "hours and remarks") {
      rowData.push(totalOTHours);
    }
    
    // Add the row with all data
    const excelRow = worksheet.addRow(rowData);
    const rowIndex = startRow + index;
    
    // Now apply conditional formatting for discrepancies > 0.25
    if (option === "hours" || option === "remarks" || option === "hours and remarks") {
      let colIndex = 5; // Start after employee details columns
      
      for (const dateHeader of dateHeaders) {
        const [day, monthStr] = dateHeader.split('-');
        
        // Find attendance and metrics for this date
        const attendance = attendanceData.find(a => {
          const attendanceDate = moment(a.attendance_date);
          return a.employee_id === employeeId && 
                attendanceDate.date() === parseInt(day, 10) && 
                attendanceDate.month() + 1 === parseInt(monthStr, 10);
        });
        
        if (attendance && employeeMetrics) {
          const metricsDataValues = employeeMetrics.dataValues || employeeMetrics;
          const expectedNetHours = getHoursFromMetricsJson(metricsDataValues.network_hours, day);
          const expectedOTHours = getHoursFromMetricsJson(metricsDataValues.overtime_hours, day);
          
          const netHours = attendance.network_hours || 0;
          const otHours = attendance.overtime_hours || 0;
          
          // Check for net hours discrepancy
          if (Math.abs(netHours - expectedNetHours) > 0.25) {
            worksheet.getCell(rowIndex, colIndex).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFC0CB' } // Light red/pink
            };
          }
          
          // Check for OT hours discrepancy
          if (Math.abs(otHours - expectedOTHours) > 0.25) {
            worksheet.getCell(rowIndex, colIndex + 1).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFC0CB' } // Light red/pink
            };
          }
        }
        
        // Advance column index based on option
        if (option === "hours") {
          colIndex += 2; // Net Hr + OT Hr
        } else if (option === "remarks") {
          colIndex += 3; // Net Hr + OT Hr + Remarks
        } else {
          colIndex += 3; // Default: Net Hr + OT Hr + Remarks
        }
      }
    }
  });
}

/**
 * Add totals row to the worksheet
 * @param {ExcelJS.Worksheet} worksheet - Excel worksheet
 * @param {number} employeeCount - Number of employees
 * @param {number} dateCount - Number of dates
 * @param {string} option - Report option
 */
function addTotalsRow(worksheet, employeeCount, dateCount, option) {
  console.log(`Adding totals row for ${employeeCount} employees and ${dateCount} dates`);
  
  // Get the current row count
  const rowCount = worksheet.rowCount;
  const startRow = option === "count" ? 2 : 3;
  
  const totalsRow = ['TOTAL', '', '', ''];
  
  let colIndex = 5;
  let netHoursTotal = 0;
  let otHoursTotal = 0;
  
  try {
    // Calculate totals for each date
    for (let dateIndex = 0; dateIndex < dateCount; dateIndex++) {
      if (option === "count") {
        // Sum the count column
        let dateTotal = 0;
        for (let empIndex = 0; empIndex < employeeCount; empIndex++) {
          try {
            const cellValue = worksheet.getCell(startRow + empIndex, colIndex).value;
            dateTotal += cellValue ? parseInt(cellValue, 10) : 0;
          } catch (err) {
            console.log(`Warning: Failed to get cell value for row ${startRow + empIndex}, column ${colIndex}`);
          }
        }
        totalsRow.push(dateTotal);
        colIndex += 1;
      } else if (option === "hours") {
        // Sum the net hours column
        let dateNetTotal = 0;
        for (let empIndex = 0; empIndex < employeeCount; empIndex++) {
          try {
            const cellValue = worksheet.getCell(startRow + empIndex, colIndex).value;
            dateNetTotal += cellValue || 0;
          } catch (err) {
            console.log(`Warning: Failed to get cell value for row ${startRow + empIndex}, column ${colIndex}`);
          }
        }
        totalsRow.push(dateNetTotal);
        
        // Sum the OT hours column
        let dateOTTotal = 0;
        for (let empIndex = 0; empIndex < employeeCount; empIndex++) {
          try {
            const cellValue = worksheet.getCell(startRow + empIndex, colIndex + 1).value;
            dateOTTotal += cellValue || 0;
          } catch (err) {
            console.log(`Warning: Failed to get cell value for row ${startRow + empIndex}, column ${colIndex + 1}`);
          }
        }
        totalsRow.push(dateOTTotal);
        
        netHoursTotal += dateNetTotal;
        otHoursTotal += dateOTTotal;
        colIndex += 2;
      } else if (option === "remarks") {
        // Sum the net hours column
        let dateNetTotal = 0;
        for (let empIndex = 0; empIndex < employeeCount; empIndex++) {
          try {
            const cellValue = worksheet.getCell(startRow + empIndex, colIndex).value;
            dateNetTotal += cellValue || 0;
          } catch (err) {
            console.log(`Warning: Failed to get cell value for row ${startRow + empIndex}, column ${colIndex}`);
          }
        }
        totalsRow.push(dateNetTotal);
        
        // Sum the OT hours column
        let dateOTTotal = 0;
        for (let empIndex = 0; empIndex < employeeCount; empIndex++) {
          try {
            const cellValue = worksheet.getCell(startRow + empIndex, colIndex + 1).value;
            dateOTTotal += cellValue || 0;
          } catch (err) {
            console.log(`Warning: Failed to get cell value for row ${startRow + empIndex}, column ${colIndex + 1}`);
          }
        }
        totalsRow.push(dateOTTotal);
        
        // No total for remarks
        totalsRow.push('');
        
        netHoursTotal += dateNetTotal;
        otHoursTotal += dateOTTotal;
        colIndex += 3;
      } else if (option === "count and remarks") {
        // Sum the count column
        let dateTotal = 0;
        for (let empIndex = 0; empIndex < employeeCount; empIndex++) {
          try {
            const cellValue = worksheet.getCell(startRow + empIndex, colIndex).value;
            dateTotal += cellValue ? parseInt(cellValue, 10) : 0;
          } catch (err) {
            console.log(`Warning: Failed to get cell value for row ${startRow + empIndex}, column ${colIndex}`);
          }
        }
        totalsRow.push(dateTotal);
        
        // No total for remarks
        totalsRow.push('');
        colIndex += 2;
      } else {
        // Default to hours and remarks
        // Sum the net hours column
        let dateNetTotal = 0;
        for (let empIndex = 0; empIndex < employeeCount; empIndex++) {
          try {
            const cellValue = worksheet.getCell(startRow + empIndex, colIndex).value;
            dateNetTotal += cellValue || 0;
          } catch (err) {
            console.log(`Warning: Failed to get cell value for row ${startRow + empIndex}, column ${colIndex}`);
          }
        }
        totalsRow.push(dateNetTotal);
        
        // Sum the OT hours column
        let dateOTTotal = 0;
        for (let empIndex = 0; empIndex < employeeCount; empIndex++) {
          try {
            const cellValue = worksheet.getCell(startRow + empIndex, colIndex + 1).value;
            dateOTTotal += cellValue || 0;
          } catch (err) {
            console.log(`Warning: Failed to get cell value for row ${startRow + empIndex}, column ${colIndex + 1}`);
          }
        }
        totalsRow.push(dateOTTotal);
        
        // No total for remarks
        totalsRow.push('');
        
        netHoursTotal += dateNetTotal;
        otHoursTotal += dateOTTotal;
        colIndex += 3;
      }
    }
    
    // Add overall totals
    totalsRow.push(netHoursTotal);
    if (option === "hours" || option === "remarks" || option === "hours and remarks") {
      totalsRow.push(otHoursTotal);
    }
    
    // Add the row to the worksheet
    worksheet.addRow(totalsRow);
    console.log("Successfully added totals row");
  } catch (error) {
    console.error("Error adding totals row:", error);
    // Add a simpler totals row as a fallback
    worksheet.addRow(['TOTAL', '', '', '', '(Error calculating totals)']);
  }
}

/**
 * Style the worksheet
 * @param {ExcelJS.Worksheet} worksheet - Excel worksheet
 * @param {string} option - Report option
 * @param {number} dateCount - Number of dates
 */
function styleWorksheet(worksheet, option, dateCount) {
  // Set header style
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: 'center' };
  
  if (option !== "count") {
    const subHeaderRow = worksheet.getRow(2);
    subHeaderRow.font = { bold: true };
    subHeaderRow.alignment = { horizontal: 'center' };
  }
  
  // Set borders for all cells
  const lastRow = worksheet.rowCount;
  const lastCol = worksheet.columnCount;
  
  for (let row = 1; row <= lastRow; row++) {
    for (let col = 1; col <= lastCol; col++) {
      const cell = worksheet.getCell(row, col);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      // Align numbers to right
      if (typeof cell.value === 'number') {
        cell.alignment = { horizontal: 'right' };
      }
    }
  }
  
  // Make the outer border thicker
  for (let col = 1; col <= lastCol; col++) {
    // Top row
    worksheet.getCell(1, col).border.top.style = 'medium';
    // Bottom row
    worksheet.getCell(lastRow, col).border.bottom.style = 'medium';
  }
  
  for (let row = 1; row <= lastRow; row++) {
    // Left column
    worksheet.getCell(row, 1).border.left.style = 'medium';
    // Right column
    worksheet.getCell(row, lastCol).border.right.style = 'medium';
  }
  
  // Style the totals row
  const totalsRow = worksheet.getRow(lastRow);
  totalsRow.font = { bold: true };
  
  // Set column widths
  worksheet.getColumn(1).width = 12; // Employee ID
  worksheet.getColumn(2).width = 25; // Name
  worksheet.getColumn(3).width = 12; // Punch Code
  worksheet.getColumn(4).width = 15; // Department
  
  // Set date column widths based on option
  let colIndex = 5;
  for (let i = 0; i < dateCount; i++) {
    if (option === "count") {
      worksheet.getColumn(colIndex).width = 10;
      colIndex += 1;
    } else if (option === "hours") {
      worksheet.getColumn(colIndex).width = 10;
      worksheet.getColumn(colIndex + 1).width = 10;
      colIndex += 2;
    } else if (option === "remarks") {
      worksheet.getColumn(colIndex).width = 10;
      worksheet.getColumn(colIndex + 1).width = 10;
      worksheet.getColumn(colIndex + 2).width = 30;
      colIndex += 3;
    } else if (option === "count and remarks") {
      worksheet.getColumn(colIndex).width = 10;
      worksheet.getColumn(colIndex + 1).width = 30;
      colIndex += 2;
    } else {
      // Default to hours and remarks
      worksheet.getColumn(colIndex).width = 10;
      worksheet.getColumn(colIndex + 1).width = 10;
      worksheet.getColumn(colIndex + 2).width = 30;
      colIndex += 3;
    }
  }
  
  // Set total columns width
  worksheet.getColumn(lastCol).width = 15;
  if (option === "hours" || option === "remarks" || option === "hours and remarks") {
    worksheet.getColumn(lastCol - 1).width = 15;
  }
}

module.exports = generateSiteExpenseReport;