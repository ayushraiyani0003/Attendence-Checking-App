const xlsx = require("xlsx");

const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const workbook = xlsx.readFile(file.path);
      const sheetName = workbook.SheetNames[0]; // Assuming data is in first sheet
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert Excel to JSON with proper header handling
      const data = xlsx.utils.sheet_to_json(worksheet, {
        raw: false, // Convert numbers to strings to preserve format
        defval: ''  // Default empty cells to empty string
      });
      
      // Return the JSON representation
      resolve(data);
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      reject(error);
    }
  });
};

module.exports = {
  parseExcelFile,
};