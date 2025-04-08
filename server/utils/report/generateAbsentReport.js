const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');

async function generateAbsentReport(finalAttendanceData, metricsData, month, year, options, dateRange, employeeType, employeeDetails) {
  // console.log("Generating absent report...");
  // console.log("Report options:", options);
  
  // Parse start and end dates with dayjs
  let startDate, endDate;
  
  try {
    // Check if dateRange contains date objects or strings
    if (Array.isArray(dateRange) && dateRange.length === 2) {
      startDate = dayjs(dateRange[0]);
      endDate = dayjs(dateRange[1]);
    } else if (dateRange.startDate && dateRange.endDate) {
      startDate = dayjs(dateRange.startDate);
      endDate = dayjs(dateRange.endDate);
    } else {
      throw new Error("Invalid date range format");
    }
    
    // Validate dates
    if (!startDate.isValid() || !endDate.isValid()) {
      throw new Error("Invalid date values in dateRange");
    }
    
    // console.log("Start date:", startDate.format("YYYY-MM-DD"));
    // console.log("End date:", endDate.format("YYYY-MM-DD"));
  } catch (error) {
    console.error("Error parsing dates:", error);
    throw error;
  }
  
  // Create an array of all dates in the range
  const allDates = [];
  let currentDate = startDate;
  // Important: Use dayjs's startOf('day') to ensure we're working with dates without time component
  currentDate = currentDate.startOf('day');
  endDate = endDate.startOf('day'); 
  
  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
    allDates.push(currentDate);
    currentDate = currentDate.add(1, 'day');
  }
  
  // console.log("Total days in range:", allDates.length);
  // console.log("Days in range:", allDates.map(d => d.format('YYYY-MM-DD')));
  
  // Create a map to store attendance data by employee
  const attendanceByEmployee = {};
  
  // Process attendance data
  // console.log("Processing attendance data...");
  finalAttendanceData.forEach(attendance => {
    const employeeId = attendance.employee_id;
    
    if (!attendanceByEmployee[employeeId]) {
      attendanceByEmployee[employeeId] = {};
    }
    
    const attendanceDate = dayjs(attendance.attendance_date).format('YYYY-MM-DD');
    attendanceByEmployee[employeeId][attendanceDate] = attendance.network_hours;
    // console.log(`Employee ${employeeId} on ${attendanceDate}: ${attendance.network_hours} hours`);
  });
  
  // Extract unique employee IDs from attendance data
  const uniqueEmployeeIds = [...new Set(finalAttendanceData.map(a => a.employee_id))];
  // console.log("Unique employee IDs from attendance:", uniqueEmployeeIds);
  
  // Check if we have employeeDetails to use
  let employeesData = [];
  if (Array.isArray(employeeDetails) && employeeDetails.length > 0) {
    // console.log("Using employeeDetails array");
    employeesData = employeeDetails;
  } else if (Array.isArray(employeeType) && employeeType.length > 0) {
    // console.log("Using employeeType array");
    employeesData = employeeType;
  } else {
    // Create simple employee objects for each employee ID
    // console.log("Creating basic employee objects from attendance data");
    uniqueEmployeeIds.forEach(id => {
      employeesData.push({
        dataValues: {
          employee_id: id,
          name: `Employee ${id}`,
          department: '',
          punch_code: '',
          designation: '',
          reporting_group: ''
        }
      });
    });
  }
  
  // console.log(`Working with ${employeesData.length} employees`);
  
  // Filter based on report options
  if (employeeType === "Faulty Employees") {
    // console.log("Faulty Employees report not implemented for absent report");
    return {
      success: false,
      message: "Faulty Employees report not implemented for absent report"
    };
  }
  
  if (employeeType === "New Employees") {
    employeesData = employeesData.filter(emp => {
      if (!emp || !emp.dataValues) return false;
      return emp.dataValues.punch_code && emp.dataValues.punch_code.toLowerCase() === "new";
    });
    // console.log(`Filtered to ${employeesData.length} new employees`);
  }
  
  // Filter for employees who were absent at least once
  const employeesWithAbsences = [];
  // console.log("\nChecking for absences:");
  
  // For each employee in the data
  for (const employeeData of employeesData) {
    let employeeId, employeeName;
    
    // Try to extract employee ID from different possible structures
    if (employeeData && employeeData.dataValues) {
      employeeId = employeeData.dataValues.employee_id;
      employeeName = employeeData.dataValues.name || `Employee ${employeeId}`;
    } else if (employeeData && employeeData.employee_id) {
      employeeId = employeeData.employee_id;
      employeeName = employeeData.name || `Employee ${employeeId}`;
    } else if (typeof employeeData === 'number') {
      employeeId = employeeData;
      employeeName = `Employee ${employeeId}`;
    } else {
      // console.log("Skipping employee with missing data:", employeeData);
      continue;
    }
    
    // console.log(`\nChecking Employee ID ${employeeId} (${employeeName}):`);
    
    // If employee ID is not in attendance data and options is not "All Employees", skip
    if (!uniqueEmployeeIds.includes(employeeId) && options !== "All Employees") {
      // console.log(`  No attendance records for employee ${employeeId}, skipping`);
      continue;
    }
    
    // Check if employee was absent at least once during the date range
    let absentDays = [];
    
    for (const date of allDates) {
      const dateString = date.format('YYYY-MM-DD');
      // If no record exists for this date or network_hours is 0, consider absent
      const networkHours = attendanceByEmployee[employeeId]?.[dateString] || 0;
      
      if (networkHours === 0) {
        absentDays.push(dateString);
        // console.log(`  ${dateString}: ABSENT (${networkHours} hours)`);
      } else {
        // console.log(`  ${dateString}: Present (${networkHours} hours)`);
      }
    }
    
    // console.log(`  Total absent days: ${absentDays.length}`);
    if (absentDays.length > 0) {
      // console.log(`  Absent days: ${absentDays.join(', ')}`);
      
      // Create a standardized employee object
      const standardizedEmployee = {
        dataValues: {
          employee_id: employeeId,
          name: employeeName,
          department: employeeData.dataValues?.department || '',
          punch_code: employeeData.dataValues?.punch_code || '',
          designation: employeeData.dataValues?.designation || '',
          reporting_group: employeeData.dataValues?.reporting_group || ''
        }
      };
      
      employeesWithAbsences.push(standardizedEmployee);
    }
  }
  
  // console.log(`\nTotal employees with absences: ${employeesWithAbsences.length}`);
  
  // If no employees were absent, return early
  if (employeesWithAbsences.length === 0) {
    // console.log("No employees were absent during the date range.");
    return {
      success: true,
      message: "No employees were absent during the selected date range."
    };
  }
  
  // Create a new Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Absent Report');
  
  // Add headers
  const headers = [
    'Sr. No.',
    'Punch Code', 
    'Name', 
    'Designation', 
    'Department', 
    'Reporting Group'
  ];
  
  // Add date headers
  allDates.forEach(date => {
    // Format as DD-MM
    headers.push(date.format('DD-MM'));
  });
  
  // Add Total header
  headers.push('Total');
  
  // Set headers and column widths
  worksheet.columns = headers.map(header => {
    if (header === 'Name') {
      return { header, width: 25 };
    } else if (header === 'Sr. No.') {
      return { header, width: 7 };
    } else {
      return { header, width: 15 };
    }
  });
  
  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  
  // Define styles
  const absentStyle = {
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' } // Yellow
    },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  };
  
  const normalCellStyle = {
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  };
  
  // Apply border to header cells
  headerRow.eachCell((cell, colNumber) => {
    if (colNumber === 1) {
      // First column
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'medium' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
    } else if (colNumber === headers.length) {
      // Last column
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'medium' }
      };
    } else {
      // Middle columns
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
    }
  });
  
  // Add data rows
  employeesWithAbsences.forEach((employee, index) => {
    const emp = employee.dataValues;
    const employeeId = emp.employee_id;
    
    const rowData = [
      index + 1, // Sr. No.
      emp.punch_code,
      emp.name,
      emp.designation,
      emp.department,
      emp.reporting_group
    ];
    
    let totalAbsences = 0;
    
    // Add attendance data for each date
    allDates.forEach(date => {
      const dateString = date.format('YYYY-MM-DD');
      const networkHours = attendanceByEmployee[employeeId]?.[dateString] || 0;
      
      const isPresent = networkHours > 0;
      rowData.push(isPresent ? 1 : 0);
      
      if (!isPresent) {
        totalAbsences++;
      }
    });
    
    // Add total absences
    rowData.push(totalAbsences);
    
    // Add row to worksheet
    const row = worksheet.addRow(rowData);
    
    // Center align the attendance data and Sr. No.
    row.getCell(1).alignment = { horizontal: 'center' };
    
    // Apply styling for all cells (borders)
    row.eachCell((cell, colNumber) => {
      if (colNumber === 1) {
        // First column
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'medium' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      } else if (colNumber === headers.length) {
        // Last column
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'medium' }
        };
      } else {
        // Middle columns
        cell.border = normalCellStyle.border;
      }
    });
    
    // Apply styling for absent days (yellow background + borders)
    allDates.forEach((date, dateIndex) => {
      const dateString = date.format('YYYY-MM-DD');
      const networkHours = attendanceByEmployee[employeeId]?.[dateString] || 0;
      
      const cellIndex = dateIndex + 7; // Accounting for the 6 employee info columns (including Sr. No.)
      
      if (networkHours === 0) {
        // For absent days, use yellow background but maintain proper borders
        const cellStyle = {
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' } // Yellow
          },
          border: normalCellStyle.border
        };
        
        // If this is the last date column, use medium right border
        if (dateIndex === allDates.length - 1) {
          cellStyle.border.right = { style: 'medium' };
        }
        
        row.getCell(cellIndex).fill = cellStyle.fill;
        row.getCell(cellIndex).border = cellStyle.border;
        // Center align the values
        row.getCell(cellIndex).alignment = { horizontal: 'center' };
      } else {
        // Center align the values
        row.getCell(cellIndex).alignment = { horizontal: 'center' };
        
        // If this is the last date column, use medium right border
        if (dateIndex === allDates.length - 1) {
          row.getCell(cellIndex).border.right = { style: 'medium' };
        }
      }
    });
    
    // Center align the total column
    row.getCell(headers.length).alignment = { horizontal: 'center' };
  });
  
  // Add summary row
  const summaryRow = ['Total Absences', '', '', '', '', ''];
  
  // Calculate absences by date
  allDates.forEach((date, index) => {
    const dateString = date.format('YYYY-MM-DD');
    let absencesForDate = 0;
    
    employeesWithAbsences.forEach(employee => {
      const employeeId = employee.dataValues.employee_id;
      const networkHours = attendanceByEmployee[employeeId]?.[dateString] || 0;
      
      if (networkHours === 0) {
        absencesForDate++;
      }
    });
    
    summaryRow.push(absencesForDate);
  });
  
  // Calculate total absences
  const totalAbsences = summaryRow.slice(6).reduce((sum, current) => sum + current, 0);
  summaryRow.push(totalAbsences);
  
  // Add summary row to worksheet
  const row = worksheet.addRow(summaryRow);
  row.font = { bold: true };
  
  // Apply borders and center alignment to the summary row
  row.eachCell((cell, colNumber) => {
    if (colNumber === 1) {
      // First column
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'medium' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
    } else if (colNumber === headers.length) {
      // Last column
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'medium' }
      };
    } else {
      // Middle columns
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
    }
    
    // Center align the totals
    if (cell.col >= 7) {
      cell.alignment = { horizontal: 'center' };
    }
  });
  
  // Add a title at the top of the report
  worksheet.insertRow(1, [`Absent Report (${startDate.format('DD-MM-YYYY')} to ${endDate.format('DD-MM-YYYY')})`]);
  const titleRow = worksheet.getRow(1);
  titleRow.height = 30;
  titleRow.font = { bold: true, size: 14 };
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // Merge the title cells
  worksheet.mergeCells(`A1:${String.fromCharCode(64 + headers.length)}1`);
  
  // Format the date range in the title cell
  titleRow.getCell(1).border = {
    top: { style: 'medium' },
    left: { style: 'medium' },
    bottom: { style: 'medium' },
    right: { style: 'medium' }
  };
  
  // We've already set the medium borders for each row's first and last cell,
  // as well as the top and bottom borders in each corresponding section.
  // No additional border setting needed here.
  
  // Create reports directory if it doesn't exist
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Generate filename
  const startDateStr = startDate.format('YYYY-MM-DD');
  const endDateStr = endDate.format('YYYY-MM-DD');
  const filename = `absent_report_${startDateStr}_to_${endDateStr}.xlsx`;
  const filepath = path.join(reportsDir, filename);
  
  // Save the workbook
  await workbook.xlsx.writeFile(filepath);
  
  // console.log(`Absent report saved to: ${filepath}`);
  
  // Return the file path information
  return {
    success: true,
    filepath: filepath,
    filename: filename,
    message: `Absent report generated successfully for ${employeesWithAbsences.length} employees.`,
    type: 'file' // Add this to indicate it's a file response
  };
}

module.exports = generateAbsentReport;