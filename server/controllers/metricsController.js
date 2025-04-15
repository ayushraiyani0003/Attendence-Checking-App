const metricsService = require("../services/metricsService");

const handleMetricsUpload = async (req, res) => {
  try {
    // Extract files and month_year from the request
    const { networkFile, otFile } = req.files;
    const { monthYear } = req.body;

    // Validate that the necessary data exists
    if (!networkFile || !otFile || !monthYear) {
      return res.status(400).json({
        success: false,
        message: "Please upload both files and provide a valid month-year."
      });
    }

    // Call the service to handle file processing and data insertion
    const result = await metricsService.processMetricsFiles(
      networkFile[0], // The first file in the array (multer handles it as an array)
      otFile[0], // The first file in the array (multer handles it as an array)
      monthYear
    );

    // Send a success response
    return res.status(200).json({ 
      success: true, 
      message: "Files uploaded successfully", 
      result 
    });
  } catch (error) {
    console.error("Error in file upload:", error);
    
    // Send the exact error message to the client
    return res.status(400).json({ 
      success: false,
      message: error.message // Send the exact error message
    });
  }
};

module.exports = {
  handleMetricsUpload,
};