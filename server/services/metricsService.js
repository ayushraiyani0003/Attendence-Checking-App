const Metrics = require("../models/metricsModel");
const { parseExcelFile } = require("../utils/fileUtils");

const processMetricsFiles = async (networkFile, otFile, monthYear) => {
  try {
    // Parse Network Hours and OT Hours files
    const networkData = await parseExcelFile(networkFile);
    const otData = await parseExcelFile(otFile);

    // Print headers for debugging
    // console.log("Network File Headers:", Object.keys(networkData[0]));
    // console.log("OT File Headers:", Object.keys(otData[0]));

    // Calculate the number of days in the month
    const [year, month] = monthYear.split("-");
    const daysInMonth = new Date(year, month, 0).getDate();

    // Process all rows of data
    const networkDataFull = networkData;
    const otDataFull = otData;

    // Group data by punch_code (User ID)
    const metricsMap = {};

    // Process network hours data
    networkDataFull.forEach((entry) => {
      const punchCode = entry['User ID'];
      if (!punchCode) return; // Skip entries without User ID
      
      const networkHours = [];

      // Get all day columns (01, 02, 03, etc.)
      const dayColumns = Object.keys(entry).filter(key => {
        // Check if key is a date format (01-31)
        return /^(0?[1-9]|[12][0-9]|3[01])$/.test(key);
      });

      // Process each day column
      dayColumns.forEach(dayStr => {
        // Get hours value for this day
        let hours = entry[dayStr];
        
        // Skip if no hours recorded
        if (hours === undefined || hours === null || hours === '') {
          hours = 0;
        }
        
        // Convert string time format to decimal hours
        if (typeof hours === 'string' && hours.includes(':')) {
          const [h, m] = hours.split(':').map(Number);
          hours = h + (m / 60);
        }

        // Format the day as "01", "02", etc.
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
      const punchCode = entry['User ID'];
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

      // Get all day columns (01, 02, 03, etc.)
      const dayColumns = Object.keys(entry).filter(key => {
        // Check if key is a date format (01-31)
        return /^(0?[1-9]|[12][0-9]|3[01])$/.test(key);
      });

      // Process each day column
      dayColumns.forEach(dayStr => {
        // Get hours value for this day
        let hours = entry[dayStr];
        
        // Skip if no hours recorded
        if (hours === undefined || hours === null || hours === '') {
          hours = 0;
        }
        
        // Convert string time format to decimal hours
        if (typeof hours === 'string' && hours.includes(':')) {
          const [h, m] = hours.split(':').map(Number);
          hours = h + (m / 60);
        }

        // Format the day as "01", "02", etc.
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

        // console.log(`Found ${existingRecords.length} existing records for ${monthYear}`);
        
        // Create a map of existing records by metric_id for quick lookup
        const existingRecordsMap = {};
        existingRecords.forEach(record => {
          existingRecordsMap[record.metric_id] = record;
        });
        
        // Insert data in smaller batches to avoid connection timeout
        const batchSize = 5;
        
        // Log first record for debugging
        // console.log("Sample record to be processed:", JSON.stringify(metricsData[0], null, 2));
        
        // Process in batches
        for (let i = 0; i < metricsData.length; i += batchSize) {
          const batch = metricsData.slice(i, i + batchSize);
          
          // For each record in the batch, check if it exists and update, or create new
          const promises = batch.map(async (record) => {
            const existingRecord = existingRecordsMap[record.metric_id];
            
            if (existingRecord) {
              // Update existing record
              // console.log(`Updating existing record: ${record.metric_id}`);
              return existingRecord.update({
                network_hours: record.network_hours,
                overtime_hours: record.overtime_hours,
                updated_at: new Date()
              });
            } else {
              // Create new record
              // console.log(`Creating new record: ${record.metric_id}`);
              return Metrics.create(record);
            }
          });
          
          const results = await Promise.all(promises);
          insertedData = insertedData.concat(results);
          // console.log(`Processed batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(metricsData.length/batchSize)}`);
        }
      } catch (dbError) {
        console.error("Database operation error:", dbError);
        // Log more details about the failing record if available
        if (dbError.errors && dbError.errors.length > 0) {
          console.error("Error details:", dbError.errors[0]);
        }
        throw new Error(`Database error: ${dbError.message}`);
      }
    }

    return insertedData;
  } catch (error) {
    console.error("Error processing metrics files:", error);
    throw error;
  }
};

// get metrix data.
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
  processMetricsFiles,fetchMetricsForMonthYear
};