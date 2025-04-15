const Metrics = require("../models/metricsModel");
const { parseExcelFile } = require("../utils/fileUtils");

/**
 * Validates Excel file format to ensure it has the required structure
 * @param {Array} data - Parsed Excel data
 * @param {String} fileType - Type of file being validated ('network' or 'overtime')
 * @returns {Object} - {isValid: boolean, errorMessage: string}
 */
const validateFileFormat = (data, fileType) => {
  // Check if data is empty
  if (!data || data.length === 0) {
    return {
      isValid: false,
      errorMessage: "File is empty or could not be parsed correctly."
    };
  }

  // Get all column headers and log them for debugging
  const headers = Object.keys(data[0]);
  console.log(`[DEBUG] ${fileType} file headers:`, headers);
  
  // More flexible User ID column detection
  const userIdColumn = headers.find(h => 
    h === "User ID" || 
    h === "UserID" || 
    h === "User Id" ||
    h === "userId" ||
    h === "ID" ||
    h === "Id" ||
    h === "id" ||
    h === "EMP ID" ||
    h === "Employee ID" ||
    h === "EmployeeID" ||
    h === "Employee Id" ||
    h === "Name" || 
    h === "Employee" ||
    h === "employee" ||
    (h.toLowerCase().includes("user") && h.toLowerCase().includes("id")) ||
    (h.toLowerCase().includes("emp") && h.toLowerCase().includes("id")) ||
    (h.toLowerCase().includes("employee") && h.toLowerCase().includes("id"))
  );

  if (!userIdColumn) {
    // Simplified error message for missing User ID column
    return {
      isValid: false,
      errorMessage: "User ID column not found in file. Please add a 'User ID' column."
    };
  }

  // Check if date columns exist (columns with numeric names like 1, 2, 3, etc.)
  const dateColumns = headers.filter(header => /^(0?[1-9]|[12][0-9]|3[01])(\s+[A-Za-z]{3})?$/.test(header));
  console.log(`[DEBUG] ${fileType} file date columns:`, dateColumns);
  
  if (dateColumns.length === 0) {
    return {
      isValid: false,
      errorMessage: "Date columns not found. Column names should be numbers (1, 2, 3, etc.)."
    };
  }

  // Check data format in cells (time format like 9:00, 11:00, 2:30)
  // We'll check a sample of non-empty cells to see if they follow time format
  let timeFormatFound = false;
  let nonEmptyValuesChecked = 0;

  for (let i = 0; i < data.length && nonEmptyValuesChecked < 5; i++) {
    const row = data[i];
    for (const col of dateColumns) {
      const value = row[col];
      if (value && value !== "") {
        nonEmptyValuesChecked++;
        
        // Check if it's a time string in the format HH:MM
        if (typeof value === "string" && /^\d{1,2}:\d{2}$/.test(value)) {
          timeFormatFound = true;
          break;
        }
      }
    }
    if (timeFormatFound) break;
  }

  if (!timeFormatFound && nonEmptyValuesChecked > 0) {
    return {
      isValid: false,
      errorMessage: "Time values must be in the format HH:MM (e.g., 9:00, 11:30)."
    };
  }

  // Return success with the identified User ID column name for future use
  return { isValid: true, errorMessage: "", userIdColumn };
};

const processMetricsFiles = async (networkFile, otFile, monthYear) => {
  try {
    console.log("[DEBUG] Starting file processing");
    console.log("[DEBUG] Network file name:", networkFile.originalname);
    console.log("[DEBUG] OT file name:", otFile.originalname);
    
    // Parse Network Hours and OT Hours files
    const networkData = await parseExcelFile(networkFile);
    const otData = await parseExcelFile(otFile);

    console.log("[DEBUG] Files parsed successfully");
    console.log("[DEBUG] Network data rows:", networkData.length);
    console.log("[DEBUG] OT data rows:", otData.length);

    // Validate file formats
    const networkValidation = validateFileFormat(networkData, 'network');
    if (!networkValidation.isValid) {
      throw new Error(`Network hours file: ${networkValidation.errorMessage}`);
    }

    const otValidation = validateFileFormat(otData, 'overtime');
    if (!otValidation.isValid) {
      throw new Error(`Overtime hours file: ${otValidation.errorMessage}`);
    }

    console.log("[DEBUG] Files validated successfully");
    console.log("[DEBUG] Network User ID column:", networkValidation.userIdColumn);
    console.log("[DEBUG] OT User ID column:", otValidation.userIdColumn);

    // Get the actual User ID column names found in each file
    const networkUserIdColumn = networkValidation.userIdColumn;
    const otUserIdColumn = otValidation.userIdColumn;

    // Calculate the number of days in the month
    const [year, month] = monthYear.split("-");
    const daysInMonth = new Date(year, month, 0).getDate();

    // Process all rows of data
    const networkDataFull = networkData;
    const otDataFull = otData;

    // Group data by punch_code (User ID)
    const metricsMap = {};

    // Helper function to check if a column is a date column
    const isDateColumn = (key) => {
      // Check for all three date formats:
      // 1. Simple day number (01-31)
      const simpleFormat = /^(0?[1-9]|[12][0-9]|3[01])$/;
      
      // 2. Day with weekday format like "1    Tue"
      const dayWeekdayFormat = /^(0?[1-9]|[12][0-9]|3[01])\s+[A-Za-z]{3}$/;
      
      // 3. Full date format like "01/04/2025" or other variants
      const fullDateFormat = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-]\d{4}$/;
      
      return simpleFormat.test(key) || 
             dayWeekdayFormat.test(key) || 
             fullDateFormat.test(key);
    };

    // Helper function to extract day number from any date format
    const extractDayFromKey = (key) => {
      // For simple day number or day with weekday, extract the number part
      if (/^(0?[1-9]|[12][0-9]|3[01])/.test(key)) {
        return key.split(/\s+/)[0]; // Extract just the day number
      }
      
      // For full date format like "01/04/2025"
      const fullDateMatch = key.match(/^(0?[1-9]|[12][0-9]|3[01])[\/\-]/);
      if (fullDateMatch) {
        return fullDateMatch[1];
      }
      
      return key; // Fallback
    };

    // Process network hours data
    networkDataFull.forEach((entry) => {
      // Use the detected User ID column name
      const punchCode = entry[networkUserIdColumn];
      if (!punchCode) return; // Skip entries without User ID
      
      const networkHours = [];

      // Get all date columns using the helper function
      const dateColumns = Object.keys(entry).filter(isDateColumn);

      // Process each day column
      dateColumns.forEach(dateKey => {
        // Get hours value for this day
        let hours = entry[dateKey];
        
        // Skip if no hours recorded
        if (hours === undefined || hours === null || hours === '') {
          hours = 0;
        }
        
        // Convert string time format to decimal hours
        if (typeof hours === 'string' && hours.includes(':')) {
          const [h, m] = hours.split(':').map(Number);
          hours = h + (m / 60);
        }

        // Extract the day number and format it
        const dayStr = extractDayFromKey(dateKey);
        const formattedDate = String(dayStr).padStart(2, '0');
        
        networkHours.push({
          date: formattedDate,
          hours: parseFloat(hours || 0).toFixed(2) // Ensure 2 decimal places and handle undefined
        });
      });

      // Initialize or update entry for this punch_code
      if (!metricsMap[punchCode]) {
        metricsMap[punchCode] = {
          punch_code: punchCode,
          month_year: monthYear,
          network_hours: [],
          overtime_hours: []
        };
      }
      
      metricsMap[punchCode].network_hours = networkHours;
    });

    // Process overtime hours data
    otDataFull.forEach((entry) => {
      // Use the detected User ID column name
      const punchCode = entry[otUserIdColumn];
      if (!punchCode) return; // Skip entries without User ID
      
      // Create entry for this punch code if it doesn't exist yet
      if (!metricsMap[punchCode]) {
        metricsMap[punchCode] = {
          punch_code: punchCode,
          month_year: monthYear,
          network_hours: [],
          overtime_hours: []
        };
      }
      
      const overtimeHours = [];

      // Get all date columns using the helper function
      const dateColumns = Object.keys(entry).filter(isDateColumn);

      // Process each day column
      dateColumns.forEach(dateKey => {
        // Get hours value for this day
        let hours = entry[dateKey];
        
        // Skip if no hours recorded
        if (hours === undefined || hours === null || hours === '') {
          hours = 0;
        }
        
        // Convert string time format to decimal hours
        if (typeof hours === 'string' && hours.includes(':')) {
          const [h, m] = hours.split(':').map(Number);
          hours = h + (m / 60);
        }

        // Extract the day number and format it
        const dayStr = extractDayFromKey(dateKey);
        const formattedDate = String(dayStr).padStart(2, '0');
        
        overtimeHours.push({
          date: formattedDate,
          hours: parseFloat(hours || 0).toFixed(2) // Ensure 2 decimal places and handle undefined
        });
      });
      
      metricsMap[punchCode].overtime_hours = overtimeHours;
    });

    // Convert metricsMap to an array for bulk insertion
    const metricsData = Object.values(metricsMap).map((entry) => {
      // Create a simple composite key from month-year and punch_code
      // Format: YYYY-MM_PUNCHCODE (e.g., "2023-03_123456")
      const metricId = `${monthYear}_${entry.punch_code}`;
      
      return {
        metric_id: metricId,
        punch_code: String(entry.punch_code).substring(0, 30), // Ensure punch_code isn't too long
        month_year: monthYear,
        network_hours: entry.network_hours,
        overtime_hours: entry.overtime_hours,
      };
    });

    // Handle database insertion with better error handling
    let insertedData = [];
    if (metricsData.length > 0) {
      try {
        // First, find existing records for this month-year
        const existingRecords = await Metrics.findAll({
          where: {
            month_year: monthYear
          }
        });
        
        // Create a map of existing records by metric_id for quick lookup
        const existingRecordsMap = {};
        existingRecords.forEach(record => {
          existingRecordsMap[record.metric_id] = record;
        });
        
        // Insert data in smaller batches to avoid connection timeout
        const batchSize = 5;
        
        // Process in batches
        for (let i = 0; i < metricsData.length; i += batchSize) {
          const batch = metricsData.slice(i, i + batchSize);
          
          // For each record in the batch, check if it exists and update, or create new
          const promises = batch.map(async (record) => {
            const existingRecord = existingRecordsMap[record.metric_id];
            
            if (existingRecord) {
              // Update existing record
              return existingRecord.update({
                network_hours: record.network_hours,
                overtime_hours: record.overtime_hours,
                updated_at: new Date()
              });
            } else {
              // Create new record
              return Metrics.create(record);
            }
          });
          
          const results = await Promise.all(promises);
          insertedData = insertedData.concat(results);
        }
      } catch (dbError) {
        console.error("Database operation error:", dbError);
        // Simplified database error message
        throw new Error("Database error while saving data. Please try again.");
      }
    }

    return insertedData;
  } catch (error) {
    console.error("Error processing metrics files:", error);
    throw error;
  }
};

// Function to fetch metrics data for a specific month and year
async function fetchMetricsForMonthYear(month, year) {
  try {
    // Format month to ensure it's two digits (e.g., 1 -> '01')
    const formattedMonth = month.toString().padStart(2, '0');
    
    // Create the month_year format used in your database (YYYY-MM)
    const monthYearFormat = `${year}-${formattedMonth}`;
    
    // Query the database for records matching the month_year
    const metricsData = await Metrics.findAll({
      where: {
        month_year: monthYearFormat
      },
      // Optional: Add any ordering if needed
      order: [
        ['created_at', 'DESC']
      ]
    });
    
    return metricsData;
  } catch (error) {
    console.error('Error fetching metrics data:', error);
    throw error;
  }
}

module.exports = {
  processMetricsFiles,
  fetchMetricsForMonthYear,
  validateFileFormat
};