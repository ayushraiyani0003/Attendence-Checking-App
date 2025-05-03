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
  // Create Excel workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Site Expense Report');

  // Parse date range
  const startDate = moment(dateRange[0]);
  const endDate = moment(dateRange[1]);

  // Map for faster lookups
  const attendanceMap = createAttendanceMap(finalAttendanceData);
  const metricsMap = createMetricsMap(metricsData);

  // Filter employees based on employeeType
  let filteredEmployees = filterEmployeesByType(employeeDetails, employeeType, finalAttendanceData, metricsData);

  // Filter employees who have site in comment at least once
  filteredEmployees = filterEmployeesWithSiteVisits(filteredEmployees, finalAttendanceData);

  if (filteredEmployees.length === 0) {
    return createEmptyReport(option, startDate, endDate, employeeType, workbook);
  }

  // Create date headers based on date range
  const { dateHeaders, dateToWeekdayMap } = generateDateHeaders(startDate, endDate);

  // Continue with report generation...
  setupWorksheetHeaders(worksheet, dateHeaders, option);

  // Aggregate data - now passing dateToWeekdayMap
  const { totals, siteCountTotal, netHrCountTotal, otHrCountTotal } = populateDataRows(
    worksheet, 
    filteredEmployees, 
    attendanceMap, 
    metricsMap, 
    dateHeaders, 
    dateToWeekdayMap, 
    option
  );

  // Highlight header cells for Wednesday dates
  highlightWednesdayHeaders(worksheet, dateHeaders, dateToWeekdayMap, option);

  // Add totals row with the aggregated data
  addTotalsRow(worksheet, filteredEmployees.length, dateHeaders.length, option, totals, siteCountTotal, netHrCountTotal, otHrCountTotal);

  // Apply styles
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

  // Save the workbook
  await workbook.xlsx.writeFile(filePath);

  return {
    success: true,
    filepath: filePath,
    filename: filename,
    message: `Site expense report generated successfully for employees.`,
    type: 'file'
  };
}

function highlightWednesdayHeaders(worksheet, dateHeaders, dateToWeekdayMap, option) {
  const headerRow = option === "count" ? 1 : 2;
  let colIndex = 5; // Start after employee details columns

  for (const dateHeader of dateHeaders) {
    if (dateToWeekdayMap[dateHeader] === 3) { // 3 is Wednesday
      if (option === "count") {
        worksheet.getCell(headerRow, colIndex).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
        colIndex += 1;
      } else if (option === "hours") {
        worksheet.getCell(headerRow, colIndex).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
        worksheet.getCell(headerRow, colIndex + 1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
        colIndex += 2;
      } else if (option === "remarks") {
        worksheet.getCell(headerRow, colIndex).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
        worksheet.getCell(headerRow, colIndex + 1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
        worksheet.getCell(headerRow, colIndex + 2).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
        colIndex += 3;
      } else if (option === "count,remarks") {
        worksheet.getCell(headerRow, colIndex).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
        worksheet.getCell(headerRow, colIndex + 1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
        colIndex += 2;
      } else {
        // Default to hours and remarks
        worksheet.getCell(headerRow, colIndex).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
        worksheet.getCell(headerRow, colIndex + 1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
        worksheet.getCell(headerRow, colIndex + 2).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
        colIndex += 3;
      }
    } else {
      // Skip non-Wednesday columns
      if (option === "count") {
        colIndex += 1;
      } else if (option === "hours") {
        colIndex += 2;
      } else if (option === "remarks") {
        colIndex += 3;
      } else if (option === "count,remarks") {
        colIndex += 2;
      } else {
        colIndex += 3;
      }
    }
  }
  
  // If there are merged header cells in row 1, also color those for Wednesdays
  if (option !== "count") {
    colIndex = 5; // Reset to start after employee details columns
    for (const dateHeader of dateHeaders) {
      if (dateToWeekdayMap[dateHeader] === 3) { // 3 is Wednesday
        if (option === "hours") {
          worksheet.getCell(1, colIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFCF' } // Light red/pink
          };
          colIndex += 2;
        } else if (option === "remarks") {
          worksheet.getCell(1, colIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFCF' } // Light red/pink
          };
          colIndex += 3;
        } else if (option === "count,remarks") {
          worksheet.getCell(1, colIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFCF' } // Light red/pink
          };
          colIndex += 2;
        } else {
          // Default to hours and remarks
          worksheet.getCell(1, colIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFCF' } // Light red/pink
          };
          colIndex += 3;
        }
      } else {
        // Skip non-Wednesday columns
        if (option === "hours") {
          colIndex += 2;
        } else if (option === "remarks") {
          colIndex += 3;
        } else if (option === "count,remarks") {
          colIndex += 2;
        } else {
          colIndex += 3;
        }
      }
    }
  }
}

/**
 * Create a map of attendance data for faster lookups
 * @param {Array} attendanceData - Attendance data
 * @returns {Object} - Map of attendance data by employee ID and date
 */
function createAttendanceMap(attendanceData) {
  const map = {};

  for (const record of attendanceData) {
    const employeeId = record.employee_id;
    const date = moment(record.attendance_date).format('DD-MM');

    if (!map[employeeId]) {
      map[employeeId] = {};
    }

    map[employeeId][date] = record;
  }

  return map;
}

/**
 * Create a map of metrics data for faster lookups
 * @param {Array} metricsData - Metrics data
 * @returns {Object} - Map of metrics data by punch code
 */
function createMetricsMap(metricsData) {
  const map = {};

  for (const record of metricsData) {
    const metricsDataValues = record.dataValues || record;
    const punchCode = metricsDataValues.punch_code;

    map[punchCode] = metricsDataValues;
  }

  return map;
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
  if (!employeeType || employeeType === "All Employees") {
    return employees;
  } else if (employeeType === "Faulty Employees") {
    return employees.filter(employee => {
      // Get employee data, handling both direct objects and Sequelize objects
      const employeeData = employee.dataValues || employee;
      const employeeId = employeeData.employee_id;
      const punchCode = employeeData.punch_code;

      const employeeAttendance = attendanceData.filter(a => a.employee_id === employeeId);

      if (employeeAttendance.length === 0) {
        return false;
      }

      // Find metrics for this employee
      const employeeMetrics = metricsData.find(m => {
        const metricsData = m.dataValues || m;
        return metricsData.punch_code === punchCode;
      });

      if (!employeeMetrics) {
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

        if (networkHoursDiff > 0.25 || otHoursDiff > 0.25) {
          return true;
        }
      }

      return false;
    });
  } else if (employeeType === "New Employees") {
    return employees.filter(employee => {
      const employeeData = employee.dataValues || employee;
      const punchCode = employeeData.punch_code;
      return punchCode.toLowerCase().includes("new");
    });
  }

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

    return hours;
  } catch (error) {
    console.error(`Error parsing metrics JSON for date ${date}:`, error);
    console.error(`Raw JSON data: ${JSON.stringify(hoursJson)}`);
    return 0;
  }
}

/**
 * Check if comment starts with "Site" (case insensitive)
 * @param {string} comment - Comment text
 * @returns {boolean} - True if comment starts with "Site"
 */
function isSiteComment(comment, networkHours, overtimeHours) {
  if (!comment) return false;
  return (
    comment && 
    comment.startsWith('Site') && 
    (networkHours > 0 || overtimeHours > 0)
  );
}

/**
 * Filter employees who have site in comment at least once
 * @param {Array} employees - Employee details
 * @param {Array} attendanceData - Attendance data
 * @returns {Array} - Filtered employees
 */
function filterEmployeesWithSiteVisits(employees, attendanceData) {
  // Create a map of employeeIds with valid site visits for faster lookup
  const employeesSiteMap = {};

  for (const attendance of attendanceData) {
    // Check if comment starts with "Site" and has valid hours
    if (
      attendance.comment && 
      attendance.comment.startsWith('Site') && 
      (attendance.network_hours > 0 || attendance.overtime_hours > 0)
    ) {
      employeesSiteMap[attendance.employee_id] = true;
    }
  }

  return employees.filter(employee => {
    // Get employee ID, handling both direct objects and Sequelize objects
    const employeeId = employee.dataValues ? employee.dataValues.employee_id : employee.employee_id;
    return employeesSiteMap[employeeId];
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
  const dateToWeekdayMap = {}; // Add this map to track which dates are Wednesdays
  const currentDate = startDate.clone();

  while (currentDate.isSameOrBefore(endDate)) {
    const dateStr = currentDate.format('DD-MM');
    dateHeaders.push(dateStr);
    
    // Store day of week (0-6, where 0 is Sunday and 3 is Wednesday)
    dateToWeekdayMap[dateStr] = currentDate.day();
    
    currentDate.add(1, 'day');
  }

  return { dateHeaders, dateToWeekdayMap };
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
    } else if (option === "count,remarks") {
      headerRow.push(`${date} Count`);
      headerRow.push(`${date} Remarks`);
    } else {
      // Default to hours and remarks
      headerRow.push(`${date} Net Hr`);
      headerRow.push(`${date} OT Hr`);
      headerRow.push(`${date} Remarks`);
    }
  }

  // Add total columns
  headerRow.push('Total Net Hours');
  headerRow.push('Total OT Hours');
  
  // Add Site Count total column to show total site visits
  headerRow.push('Total Site Count');
  
  // Add new total columns for Net Count and OT Count
  headerRow.push('Total Net Count');
  headerRow.push('Total OT Count');

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
    } else if (option === "count,remarks") {
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
      } else if (option === "count,remarks") {
        subHeaderRow.push('Count');
        subHeaderRow.push('Remarks');
      } else {
        // Default to hours and remarks
        subHeaderRow.push('Net Hr');
        subHeaderRow.push('OT Hr');
        subHeaderRow.push('Remarks');
      }
    }

    subHeaderRow.push(''); // Total Net Hours
    subHeaderRow.push(''); // Total OT Hours
    subHeaderRow.push(''); // Total Site Count
    subHeaderRow.push(''); // Total Net Count
    subHeaderRow.push(''); // Total OT Count

    worksheet.addRow(subHeaderRow);
  }
}

/**
 * Populate data rows in the worksheet
 * @param {ExcelJS.Worksheet} worksheet - Excel worksheet
 * @param {Array} employees - Filtered employees
 * @param {Object} attendanceMap - Map of attendance data
 * @param {Object} metricsMap - Map of metrics data
 * @param {Array} dateHeaders - Date headers
 * @param {string} option - Report option
 * @returns {Object} - Object with totals for each date and overall
 */
function populateDataRows(worksheet, employees, attendanceMap, metricsMap, dateHeaders, dateToWeekdayMap, option) {
  // Determine starting row based on option (accounting for headers)
  const startRow = option === "count" ? 1 : 2;

  // Initialize totals for each date
  const dateTotals = {
    netHours: {},
    otHours: {},
    siteCount: {},
    netCount: {},
    otCount: {}
  };

  let totalNetHours = 0;
  let totalOTHours = 0;
  let totalSiteCount = 0;
  let totalNetCount = 0;
  let totalOTCount = 0;

  employees.forEach((employee, index) => {
    
    // Handle both Sequelize objects and plain objects
    const employeeData = employee.dataValues || employee;
    const employeeId = employeeData.employee_id;
    const punchCode = employeeData.punch_code;

    const rowData = [
      employeeId,
      employeeData.name,
      punchCode,
      employeeData.department
    ];

    let employeeNetHoursTotal = 0;
    let employeeOTHoursTotal = 0;
    let employeeSiteCountTotal = 0;
    let employeeNetCountTotal = 0;
    let employeeOTCountTotal = 0;

    // Find metrics for this employee
    const employeeMetrics = metricsMap[punchCode];

    // Process each date
    let colIndex = 5; // Start after employee details columns
    for (const dateHeader of dateHeaders) {
      // Get attendance for this employee on this date
      const attendance = attendanceMap[employeeId] ? attendanceMap[employeeId][dateHeader] : null;
      const hasSiteVisit = attendance && isSiteComment(attendance.comment, attendance.network_hours, attendance.overtime_hours);

      // Initialize date totals if not exists
      if (!dateTotals.netHours[dateHeader]) dateTotals.netHours[dateHeader] = 0;
      if (!dateTotals.otHours[dateHeader]) dateTotals.otHours[dateHeader] = 0;
      if (!dateTotals.siteCount[dateHeader]) dateTotals.siteCount[dateHeader] = 0;
      if (!dateTotals.netCount[dateHeader]) dateTotals.netCount[dateHeader] = 0;
      if (!dateTotals.otCount[dateHeader]) dateTotals.otCount[dateHeader] = 0;

      // Only get hours and show remarks when there's a site comment
      const netHours = hasSiteVisit && attendance ? attendance.network_hours || 0 : 0;
      const otHours = hasSiteVisit && attendance ? attendance.overtime_hours || 0 : 0;
      const remark = hasSiteVisit && attendance && attendance.comment ? attendance.comment : '';

      // Check for Net Count and OT Count conditions
      const isNetCount = hasSiteVisit && netHours > 0;
      const isOTCount = hasSiteVisit && otHours > 0;

      // Handle different report options
      if (option === "count") {
        rowData.push(hasSiteVisit ? 1 : 0);

        if (hasSiteVisit) {
          employeeSiteCountTotal += 1;
          dateTotals.siteCount[dateHeader] += 1;
        }
        
        if (isNetCount) {
          employeeNetCountTotal += 1;
          dateTotals.netCount[dateHeader] += 1;
        }
        
        if (isOTCount) {
          employeeOTCountTotal += 1;
          dateTotals.otCount[dateHeader] += 1;
        }
        
        // Apply Wednesday highlighting
        if (dateToWeekdayMap[dateHeader] === 3) { // 3 is Wednesday in moment.js
          worksheet.getCell(startRow + index, colIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFCF' } // Light red/pink
          };
        }
        colIndex += 1;
      } else if (option === "hours") {
        if (hasSiteVisit) {
          employeeNetHoursTotal += netHours;
          employeeOTHoursTotal += otHours;
          employeeSiteCountTotal += 1;
          
          dateTotals.netHours[dateHeader] += netHours;
          dateTotals.otHours[dateHeader] += otHours;
          dateTotals.siteCount[dateHeader] += 1;
        }
        
        if (isNetCount) {
          employeeNetCountTotal += 1;
          dateTotals.netCount[dateHeader] += 1;
        }
        
        if (isOTCount) {
          employeeOTCountTotal += 1;
          dateTotals.otCount[dateHeader] += 1;
        }

        // Only show hours when there's a site comment
        rowData.push(hasSiteVisit ? netHours : 0);
        rowData.push(hasSiteVisit ? otHours : 0);
        
        // Apply Wednesday highlighting
        if (dateToWeekdayMap[dateHeader] === 3) { // 3 is Wednesday
          worksheet.getCell(startRow + index, colIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFCF' } // Light red/pink
          };
          worksheet.getCell(startRow + index, colIndex + 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFCF' } // Light red/pink
          };
        }
        colIndex += 2;
      } else if (option === "remarks") {
        if (hasSiteVisit) {
          employeeNetHoursTotal += netHours;
          employeeOTHoursTotal += otHours;
          employeeSiteCountTotal += 1;
          
          dateTotals.netHours[dateHeader] += netHours;
          dateTotals.otHours[dateHeader] += otHours;
          dateTotals.siteCount[dateHeader] += 1;
        }
        
        if (isNetCount) {
          employeeNetCountTotal += 1;
          dateTotals.netCount[dateHeader] += 1;
        }
        
        if (isOTCount) {
          employeeOTCountTotal += 1;
          dateTotals.otCount[dateHeader] += 1;
        }

        // Only show hours and remarks when there's a site comment
        rowData.push(hasSiteVisit ? netHours : 0);
        rowData.push(hasSiteVisit ? otHours : 0);
        rowData.push(remark);
        
        // Apply Wednesday highlighting
        if (dateToWeekdayMap[dateHeader] === 3) { // 3 is Wednesday
          worksheet.getCell(startRow + index, colIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFCF' } // Light red/pink
          };
          worksheet.getCell(startRow + index, colIndex + 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFCF' } // Light red/pink
          };
          worksheet.getCell(startRow + index, colIndex + 2).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFCF' } // Light red/pink
          };
        }
        colIndex += 3;
      } else if (option === "count,remarks") {
        if (hasSiteVisit) {
          employeeSiteCountTotal += 1;
          dateTotals.siteCount[dateHeader] += 1;
        }
        
        if (isNetCount) {
          employeeNetCountTotal += 1;
          dateTotals.netCount[dateHeader] += 1;
        }
        
        if (isOTCount) {
          employeeOTCountTotal += 1;
          dateTotals.otCount[dateHeader] += 1;
        }

        rowData.push(hasSiteVisit ? 1 : 0);
        rowData.push(remark);
        
        // Apply Wednesday highlighting
        if (dateToWeekdayMap[dateHeader] === 3) { // 3 is Wednesday
          worksheet.getCell(startRow + index, colIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFCF' } // Light red/pink
          };
          worksheet.getCell(startRow + index, colIndex + 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFCF' } // Light red/pink
          };
        }
        colIndex += 2;
      } else {
        // Default to hours and remarks
        if (hasSiteVisit) {
          employeeNetHoursTotal += netHours;
          employeeOTHoursTotal += otHours;
          employeeSiteCountTotal += 1;
          
          dateTotals.netHours[dateHeader] += netHours;
          dateTotals.otHours[dateHeader] += otHours;
          dateTotals.siteCount[dateHeader] += 1;
        }
        
        if (isNetCount) {
          employeeNetCountTotal += 1;
          dateTotals.netCount[dateHeader] += 1;
        }
        
        if (isOTCount) {
          employeeOTCountTotal += 1;
          dateTotals.otCount[dateHeader] += 1;
        }

        // Only show hours and remarks when there's a site comment
        rowData.push(hasSiteVisit ? netHours : null);
        rowData.push(hasSiteVisit ? otHours : null);
        rowData.push(remark);
        
        // Apply Wednesday highlighting
        if (dateToWeekdayMap[dateHeader] === 3) { // 3 is Wednesday

          worksheet.getCell(startRow + index, colIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFCF' } // Light red/pink
          };
          worksheet.getCell(startRow + index, colIndex + 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFCF' } // Light red/pink
          };
          worksheet.getCell(startRow + index, colIndex + 2).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFCF' } // Light red/pink
          };
        }
        colIndex += 3;
      }
    }

    // Add total columns
    rowData.push(employeeNetHoursTotal);
    totalNetHours += employeeNetHoursTotal;

    rowData.push(employeeOTHoursTotal);
    totalOTHours += employeeOTHoursTotal;

    // Add total site count for this employee
    rowData.push(employeeSiteCountTotal);
    totalSiteCount += employeeSiteCountTotal;
    
    // Add total Net Count for this employee
    rowData.push(employeeNetCountTotal);
    totalNetCount += employeeNetCountTotal;
    
    // Add total OT Count for this employee
    rowData.push(employeeOTCountTotal);
    totalOTCount += employeeOTCountTotal;

    // Add the row with all data
    const excelRow = worksheet.addRow(rowData);
    const rowIndex = startRow + index;

    // Apply conditional formatting for discrepancies if metrics data exists
    if ((option === "hours" || option === "remarks" || option === "hours and remarks") && employeeMetrics) {
      applyConditionalFormatting(worksheet, rowIndex, employeeId, employeeMetrics, attendanceMap, dateHeaders, dateToWeekdayMap, option);
    }
  });

  return {
    totals: {
      netHours: totalNetHours,
      otHours: totalOTHours,
      dailyNetHours: dateTotals.netHours,
      dailyOTHours: dateTotals.otHours,
      dailySiteCount: dateTotals.siteCount,
      dailyNetCount: dateTotals.netCount,
      dailyOTCount: dateTotals.otCount
    },
    siteCountTotal: totalSiteCount,
    netHrCountTotal: totalNetCount,
    otHrCountTotal: totalOTCount
  };
}

/**
 * Apply conditional formatting for hour discrepancies
 * @param {ExcelJS.Worksheet} worksheet - Excel worksheet
 * @param {number} rowIndex - Row index
 * @param {string} employeeId - Employee ID
 * @param {Object} employeeMetrics - Employee metrics data
 * @param {Object} attendanceMap - Map of attendance data
 * @param {Array} dateHeaders - Date headers
 * @param {Object} dateToWeekdayMap - Map of dates to weekdays
 * @param {string} option - Report option
 */
function applyConditionalFormatting(worksheet, rowIndex, employeeId, employeeMetrics, attendanceMap, dateHeaders, dateToWeekdayMap, option) {
  let colIndex = 5; // Start after employee details columns

  for (const dateHeader of dateHeaders) {
    const [day, monthStr] = dateHeader.split('-');

    // Get attendance for this employee on this date
    const attendance = attendanceMap[employeeId] ? attendanceMap[employeeId][dateHeader] : null;
    const hasSiteVisit = attendance && isSiteComment(attendance.comment, attendance.network_hours, attendance.overtime_hours);

    if (attendance && hasSiteVisit) {
      const expectedNetHours = getHoursFromMetricsJson(employeeMetrics.network_hours, day);
      const expectedOTHours = getHoursFromMetricsJson(employeeMetrics.overtime_hours, day);

      const netHours = attendance.network_hours;
      const otHours = attendance.overtime_hours;

      // Check for net hours discrepancy
      if (Math.abs(netHours - expectedNetHours) > 0.25) {
        worksheet.getCell(rowIndex, colIndex).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'ffffc0cb' } // Light red/pink
        };
      } 
      // Apply Wednesday highlighting (prioritize discrepancy highlighting)
      else if (dateToWeekdayMap[dateHeader] === 3) {
        worksheet.getCell(rowIndex, colIndex).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
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
      // Apply Wednesday highlighting (prioritize discrepancy highlighting)
      else if (dateToWeekdayMap[dateHeader] === 3) {
        worksheet.getCell(rowIndex, colIndex + 1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
      }
      
      // For remarks column, only apply Wednesday highlighting (no discrepancy check)
      if ((option === "remarks" || option === "hours and remarks" || option === "") && dateToWeekdayMap[dateHeader] === 3) {
        worksheet.getCell(rowIndex, colIndex + 2).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
      }
    } 
    // If no site visit, still apply Wednesday highlighting
    else if (dateToWeekdayMap[dateHeader] === 3) {
      if (option === "count") {
        worksheet.getCell(rowIndex, colIndex).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
      } else if (option === "hours") {
        worksheet.getCell(rowIndex, colIndex).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
        worksheet.getCell(rowIndex, colIndex + 1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
      } else if (option === "remarks" || option === "") {
        worksheet.getCell(rowIndex, colIndex).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
        worksheet.getCell(rowIndex, colIndex + 1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
        worksheet.getCell(rowIndex, colIndex + 2).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
      } else if (option === "count,remarks") {
        worksheet.getCell(rowIndex, colIndex).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
        worksheet.getCell(rowIndex, colIndex + 1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFCF' } // Light red/pink
        };
      }
    }

    // Advance column index based on option
    if (option === "hours") {
      colIndex += 2; // Net Hr + OT Hr
    } else if (option === "remarks") {
      colIndex += 3; // Net Hr + OT Hr + Remarks
    } else if (option === "count") {
      colIndex += 1; // Just count
    } else if (option === "count,remarks") {
      colIndex += 2; // Count + Remarks
    } else {
      colIndex += 3; // Default: Net Hr + OT Hr + Remarks
    }
  }
}

/**
 * Add totals row to the worksheet
 * @param {ExcelJS.Worksheet} worksheet - Excel worksheet
 * @param {number} employeeCount - Number of employees
 * @param {number} dateCount - Number of dates
 * @param {string} option - Report option
 * @param {Object} totals - Object with totals data
 * @param {number} siteCountTotal - Total site count
 * @param {number} netHrCountTotal - Total net hours count
 * @param {number} otHrCountTotal - Total OT hours count
 */
function addTotalsRow(worksheet, employeeCount, dateCount, option, totals, siteCountTotal, netHrCountTotal, otHrCountTotal) {
  const totalsRow = ['TOTAL', '', '', ''];

  // Add daily totals for each date
  for (const dateHeader of Object.keys(totals.dailyNetHours)) {
    if (option === "count") {
      totalsRow.push(totals.dailySiteCount[dateHeader] || 0);
    } else if (option === "hours") {
      totalsRow.push(totals.dailyNetHours[dateHeader] || 0);
      totalsRow.push(totals.dailyOTHours[dateHeader] || 0);
    } else if (option === "remarks") {
      totalsRow.push(totals.dailyNetHours[dateHeader] || 0);
      totalsRow.push(totals.dailyOTHours[dateHeader] || 0);
      totalsRow.push(''); // No total for remarks
    } else if (option === "count,remarks") {
      totalsRow.push(totals.dailySiteCount[dateHeader] || 0);
      totalsRow.push(''); // No total for remarks
    } else {
      // Default to hours and remarks
      totalsRow.push(totals.dailyNetHours[dateHeader] || 0);
      totalsRow.push(totals.dailyOTHours[dateHeader] || 0);
      totalsRow.push(''); // No total for remarks
    }
  }

  // Add overall totals
  totalsRow.push(totals.netHours);
  totalsRow.push(totals.otHours);
  totalsRow.push(siteCountTotal);
  totalsRow.push(netHrCountTotal);
  totalsRow.push(otHrCountTotal);

  // Add the row to the worksheet
  worksheet.addRow(totalsRow);
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

  // Highlight the Site Count column
  const siteCountCol = lastCol - 2;
  const siteCountCell = worksheet.getCell(1, siteCountCol);
  siteCountCell.font = { bold: true, color: { argb: '4F33FF' } };
  
  // Highlight the Net Count column
  const netCountCol = lastCol - 1;
  const netCountCell = worksheet.getCell(1, netCountCol);
  netCountCell.font = { bold: true, color: { argb: '4F33FF' } };
  
  // Highlight the OT Count column
  const otCountCol = lastCol;
  const otCountCell = worksheet.getCell(1, otCountCol);
  otCountCell.font = { bold: true, color: { argb: '4F33FF' } };

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
    } else if (option === "count,remarks") {
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
  worksheet.getColumn(lastCol - 4).width = 20; // Total Net Hours
  worksheet.getColumn(lastCol - 3).width = 20; // Total OT Hours
  worksheet.getColumn(lastCol - 2).width = 20; // Total Site Count
  worksheet.getColumn(lastCol - 1).width = 20; // Total Net Count
  worksheet.getColumn(lastCol).width = 20;     // Total OT Count
}

module.exports = generateSiteExpenseReport;