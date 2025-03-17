const metricsService = require("../services/metricsService");

// Handle file upload and process metrics data
const handleMetricsUpload = async (req, res) => {
  try {
    // Extract files and month_year from the request
    const { networkFile, otFile } = req.files;
    const { monthYear } = req.body;

    // Validate that the necessary data exists
    if (!networkFile || !otFile || !monthYear) {
      return res.status(400).json({
        message: "Please upload both files and provide a valid month-year.",
      });
    }

    // Call the service to handle file processing and data insertion
    const result = await metricsService.processMetricsFiles(
      networkFile,
      otFile,
      monthYear
    );

    // Send a success response
    return res.status(200).json({ message: "File upload successful", result });
  } catch (error) {
    console.error("Error in file upload:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = {
  handleMetricsUpload,
};
