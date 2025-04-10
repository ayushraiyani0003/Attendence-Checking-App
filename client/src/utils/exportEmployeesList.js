// Excel export utility with fixed content and borders
import * as XLSX from 'xlsx';
// Import the template directly
import getTemplate from '../assets/monthly am pm formate.xlsx';

/**
 * Generates and downloads an Excel file with employee data while preserving template format
 * @param {Array} employees - The filteredEmployees array containing employee data
 */
export const generateEmployeeExcel = async (employees) => {
  try {
    console.log('Starting Excel generation with template:', getTemplate);
    
    // Load the template file
    const response = await fetch(getTemplate);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
    }
    
    const templateArrayBuffer = await response.arrayBuffer();
    
    // Read the template with all formatting options enabled
    const workbook = XLSX.read(templateArrayBuffer, {
      type: 'array',
      cellStyles: true,
      cellDates: true,
      cellNF: true,
      cellFormula: true,
      sheetStubs: true,
      bookVBA: true,
      bookFiles: true
    });
    
    console.log('Template loaded successfully');
    
    // Get the first worksheet from the template
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Get current month in MMM-YY format
    const currentDate = new Date();
    const monthYearFormat = new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      year: '2-digit' 
    }).format(currentDate);
    
    // Group employees by department
    const departmentGroups = {};
    employees.forEach(emp => {
      if (!emp.department) {
        emp.department = 'Unassigned'; // Default department if missing
      }
      
      if (!departmentGroups[emp.department]) {
        departmentGroups[emp.department] = [];
      }
      departmentGroups[emp.department].push(emp);
    });
    
    // Track the current position in the worksheet
    let currentRow = 0;
    
    // Process each department
    Object.entries(departmentGroups).forEach(([department, deptEmployees], deptIndex) => {
      console.log(`Processing department ${deptIndex + 1}: ${department} with ${deptEmployees.length} employees`);
      
      // Calculate number of sections needed (15 employees per section)
      const numSections = Math.ceil(deptEmployees.length / 15);
      
      for (let section = 0; section < numSections; section++) {
        // Get the employees for this section (max 15)
        const startIdx = section * 15;
        const endIdx = Math.min(startIdx + 15, deptEmployees.length);
        const sectionEmployees = deptEmployees.slice(startIdx, endIdx);
        
        console.log(`Section ${section + 1} with ${sectionEmployees.length} employees, starting at row ${currentRow}`);
        
        // =========== FIRST HALF - Days 1-15 ===========
        
        // Department header (A1:E1)
        setCellValue(worksheet, currentRow, 0, department, true);
        // Merge department header
        addMergedCell(worksheet, currentRow, 0, currentRow, 4);
        
        // Month header (F1:AK1)
        setCellValue(worksheet, currentRow, 5, monthYearFormat, true);
        // Merge month header
        addMergedCell(worksheet, currentRow, 5, currentRow, 36);
        
        // Add column headers
        setCellValue(worksheet, currentRow + 2, 1, "Punch Code", true);
        setCellValue(worksheet, currentRow + 2, 2, "Name", true);
        setCellValue(worksheet, currentRow + 2, 4, "Designation", true);
        
        // Add date column headers (1-15)
        for (let day = 1; day <= 15; day++) {
          setCellValue(worksheet, currentRow + 2, day + 5, day.toString(), true);
        }
        
        // Add employee data (rows 4-18, indices 3-17)
        for (let i = 0; i < sectionEmployees.length; i++) {
          const emp = sectionEmployees[i];
          const rowIndex = currentRow + 3 + i;
          
          setCellValue(worksheet, rowIndex, 1, emp.punch_code || "", false);
          setCellValue(worksheet, rowIndex, 2, emp.name || "", false);
          setCellValue(worksheet, rowIndex, 4, emp.designation || "", false);
          
          // Add empty cells for days 1-15
          for (let day = 1; day <= 15; day++) {
            setCellValue(worksheet, rowIndex, day + 5, "", false);
          }
        }
        
        // Fill remaining rows with empty cells if needed (if less than 15 employees)
        for (let i = sectionEmployees.length; i < 15; i++) {
          const rowIndex = currentRow + 3 + i;
          
          setCellValue(worksheet, rowIndex, 1, "", false);
          setCellValue(worksheet, rowIndex, 2, "", false);
          setCellValue(worksheet, rowIndex, 4, "", false);
          
          // Add empty cells for days 1-15
          for (let day = 1; day <= 15; day++) {
            setCellValue(worksheet, rowIndex, day + 5, "", false);
          }
        }
        
        // =========== SECOND HALF - Days 16-31 ===========
        
        // Department header (A20:E20)
        setCellValue(worksheet, currentRow + 19, 0, department, true);
        // Merge department header
        addMergedCell(worksheet, currentRow + 19, 0, currentRow + 19, 4);
        
        // Month header (F20:AK20)
        setCellValue(worksheet, currentRow + 19, 5, monthYearFormat, true);
        // Merge month header
        addMergedCell(worksheet, currentRow + 19, 5, currentRow + 19, 36);
        
        // Add column headers
        setCellValue(worksheet, currentRow + 21, 1, "Punch Code", true);
        setCellValue(worksheet, currentRow + 21, 2, "Name", true);
        setCellValue(worksheet, currentRow + 21, 4, "Designation", true);
        
        // Add date column headers (16-31)
        for (let day = 16; day <= 31; day++) {
          setCellValue(worksheet, currentRow + 21, (day - 16) + 6, day.toString(), true);
        }
        
        // Add the SAME employee data (rows 23-37, indices 22-36)
        for (let i = 0; i < sectionEmployees.length; i++) {
          const emp = sectionEmployees[i];
          const rowIndex = currentRow + 22 + i;
          
          setCellValue(worksheet, rowIndex, 1, emp.punch_code || "", false);
          setCellValue(worksheet, rowIndex, 2, emp.name || "", false);
          setCellValue(worksheet, rowIndex, 4, emp.designation || "", false);
          
          // Add empty cells for days 16-31
          for (let day = 16; day <= 31; day++) {
            setCellValue(worksheet, rowIndex, (day - 16) + 6, "", false);
          }
        }
        
        // Fill remaining rows with empty cells if needed (if less than 15 employees)
        for (let i = sectionEmployees.length; i < 15; i++) {
          const rowIndex = currentRow + 22 + i;
          
          setCellValue(worksheet, rowIndex, 1, "", false);
          setCellValue(worksheet, rowIndex, 2, "", false);
          setCellValue(worksheet, rowIndex, 4, "", false);
          
          // Add empty cells for days 16-31
          for (let day = 16; day <= 31; day++) {
            setCellValue(worksheet, rowIndex, (day - 16) + 6, "", false);
          }
        }
        
        // =========== ADD BORDERS TO BOTH SECTIONS ===========
        
        // Add borders to first section (days 1-15)
        for (let row = currentRow + 2; row <= currentRow + 17; row++) {
          for (let col = 0; col <= 36; col++) {
            addBorder(worksheet, row, col); 
          }
        }
        
        // Add borders to second section (days 16-31)
        for (let row = currentRow + 21; row <= currentRow + 36; row++) {
          for (let col = 0; col <= 36; col++) {
            addBorder(worksheet, row, col);
          }
        }
        
        // Add thick outer borders to first section
        addOuterBorders(worksheet, currentRow + 2, 0, currentRow + 17, 36);
        
        // Add thick outer borders to second section
        addOuterBorders(worksheet, currentRow + 21, 0, currentRow + 36, 36);
        
        // Move to the next pair of sections (38 rows for each pair)
        currentRow += 38;
      }
    });
    
    // Ensure worksheet range is properly set
    worksheet['!ref'] = XLSX.utils.encode_range(
      { r: 0, c: 0 },
      { r: Math.max(currentRow - 1, 38), c: 36 }
    );
    
    // Generate the Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true
    });
    
    saveAsExcelFile(excelBuffer, 'Monthly_AM_PM_Schedule');
    
    return true;
  } catch (error) {
    console.error('Error generating Excel file:', error);
    throw error;
  }
};

/**
 * Helper function to set cell value with proper formatting
 */
function setCellValue(worksheet, row, col, value, isHeader) {
  const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
  
  // Create cell with value and basic formatting
  worksheet[cellRef] = { 
    v: value,
    t: typeof value === 'number' ? 'n' : 's',
    s: {
      font: { bold: isHeader },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    }
  };
  
  // For headers, add background color
  if (isHeader) {
    worksheet[cellRef].s.fill = {
      patternType: 'solid',
      fgColor: { rgb: "DDEBF7" } // Light blue color
    };
  }
}

/**
 * Helper function to add a merged cell
 */
function addMergedCell(worksheet, startRow, startCol, endRow, endCol) {
  // Initialize merges array if not present
  if (!worksheet['!merges']) worksheet['!merges'] = [];
  
  // Add the merge
  worksheet['!merges'].push({
    s: { r: startRow, c: startCol },
    e: { r: endRow, c: endCol }
  });
  
  // Create or get the top-left cell of the merged range
  const cellAddress = XLSX.utils.encode_cell({ r: startRow, c: startCol });
  if (!worksheet[cellAddress]) {
    worksheet[cellAddress] = {};
  }
  
  // Ensure the cell has a style object
  if (!worksheet[cellAddress].s) {
    worksheet[cellAddress].s = {};
  }
  
  // Set alignment to center
  worksheet[cellAddress].s.alignment = worksheet[cellAddress].s.alignment || {};
  worksheet[cellAddress].s.alignment.horizontal = 'center';
  worksheet[cellAddress].s.alignment.vertical = 'center';
  
  // Create empty cells for the rest of the merged area
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      if (r === startRow && c === startCol) continue; // Skip the top-left cell we already handled
      const currentAddress = XLSX.utils.encode_cell({ r, c });
      if (!worksheet[currentAddress]) {
        worksheet[currentAddress] = { t: 's', v: '' }; // Create empty string cell
      }
    }
  }
}

/**
 * Helper function to add border to a cell
 */
function addBorder(worksheet, row, col) {
  const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
  
  // If cell exists, add borders
  if (worksheet[cellRef]) {
    if (!worksheet[cellRef].s) worksheet[cellRef].s = {};
    
    worksheet[cellRef].s.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  } else {
    // Create an empty cell with border if it doesn't exist
    worksheet[cellRef] = {
      v: '',
      t: 's',
      s: {
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      }
    };
  }
}

/**
 * Helper function to add thick outer borders to a region
 */
function addOuterBorders(worksheet, startRow, startCol, endRow, endCol) {
  // Top border
  for (let col = startCol; col <= endCol; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: startRow, c: col });
    if (worksheet[cellRef] && worksheet[cellRef].s && worksheet[cellRef].s.border) {
      worksheet[cellRef].s.border.top = { style: 'medium' };
    }
  }
  
  // Bottom border
  for (let col = startCol; col <= endCol; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: endRow, c: col });
    if (worksheet[cellRef] && worksheet[cellRef].s && worksheet[cellRef].s.border) {
      worksheet[cellRef].s.border.bottom = { style: 'medium' };
    }
  }
  
  // Left border
  for (let row = startRow; row <= endRow; row++) {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: startCol });
    if (worksheet[cellRef] && worksheet[cellRef].s && worksheet[cellRef].s.border) {
      worksheet[cellRef].s.border.left = { style: 'medium' };
    }
  }
  
  // Right border
  for (let row = startRow; row <= endRow; row++) {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: endCol });
    if (worksheet[cellRef] && worksheet[cellRef].s && worksheet[cellRef].s.border) {
      worksheet[cellRef].s.border.right = { style: 'medium' };
    }
  }
}

/**
 * Helper function to save the Excel file
 */
function saveAsExcelFile(buffer, fileName) {
  const data = new Blob([buffer], { type: 'application/octet-stream' });
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${fileName}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}