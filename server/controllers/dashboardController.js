const db = require('../models/index');
const attendanceService = require('../services/attendenceService');
const metricsService = require('../services/metricsService');
const { getAllEmployeesService } = require('../services/employeeServices');
const { authenticateJWT, isAdmin } = require('../middlewares/authMiddleware');
const { getRedisAttendanceData } = require("../utils/getRedisAttendenceData");
const { combineAttendanceData } = require("../utils/combineAtt");
const { findMismatchesByGroup } = require("../utils/findMistamatch");
const { generateNetHrReport, generateOtHrReport, generateSiteExpenseReport, generateEveningShiftReport, generateNightShiftReport, generateDetailedGroupReport, generateAbsentReport } = require("../utils/report");

// Get graph data for the dashboard
exports.getDashboardGraphs = [async (req, res) => {
  try {

    // Get month and year from the request query
    let { month, year } = req.query;
    console.log("this is a dashboard " + month + " and " + year);
    // const month = 4;
    // const year = 2025;

    // If month and year are not provided, use current month and year
    if (!month || !year) {
      const currentDate = new Date();
      month = month || (currentDate.getMonth() + 1).toString();
      year = year || currentDate.getFullYear().toString();
      console.log(`Using default month: ${month}, year: ${year}`);
    }

    // Convert to numbers to ensure proper handling
    const numericMonth = parseInt(month, 10);
    const numericYear = parseInt(year, 10);

    // Basic validation 
    if (isNaN(numericMonth) || numericMonth < 1 || numericMonth > 12 ||
      isNaN(numericYear) || numericYear < 2000 || numericYear > 2100) {
      return res.status(400).json({
        success: false,
        message: "Invalid month or year parameters"
      });
    }

    // Get raw dashboard data using helper function
    const rawData = await getData(numericMonth, numericYear);

    // Return successful response with data
    return res.status(200).json({
      success: true,
      data: rawData
    });

  } catch (error) {
    console.error("Error fetching dashboard graph data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message
    });
  }
}];

// Helper function to get dashboard data
const getData = async (month, year) => {
  console.log(month + "-" + year);

  try {
    // 1. First, get all reporting groups from settings
    const reportingGroups = await db.ReportingGroup.findAll();

    // Extract group IDs for service call
    const reportingGroupIds = reportingGroups.map(group => group.id);

    // Extract group names for the desired array of strings
    const reportingGroupNames = reportingGroups.map(group => group.dataValues.groupname);

    if (!reportingGroupIds || reportingGroupIds.length === 0) {
      console.warn("No reporting groups found. Using empty array.");
    }
    // 2. Get employees attendance data for the month by reporting groups from mysql
    const attendanceData = await attendanceService.getDashboardEmployeesAttendanceByMonthAndGroup(
      reportingGroupNames || [],
      year,
      month
    );
    // console.log(attendanceData);
    

    // get teh attedence data from the redis db also
    const redisData = await getRedisAttendanceData(year, month, reportingGroupNames);

    // combine and get the final attendence data for comparision.
    const finalAttendanceData = combineAttendanceData(attendanceData, redisData);
    // 3. Get metrics data for the month
    const metricsData = await metricsService.fetchMetricsForMonthYear(month, year);

    // Initialize empty metrics if not returned
    if (!metricsData) {
      console.warn(`No metrics data returned for month ${month}, year ${year}`);
    }

    // 4. calculate the diff between the finalAttendanceData and metricsData
    const mismatchBygroup = findMismatchesByGroup(finalAttendanceData, metricsData);
    console.log(mismatchBygroup);

    return mismatchBygroup;
  } catch (error) {
    console.error("Error in getData function:", error);
    throw error;
  }
};

exports.getDashboardReports = [authenticateJWT, isAdmin, async (req, res) => {
  try {
    console.log("my report is called");

    // Get parameters from the request query
    let { month, year, reportType, options, dateRange, employeeType } = req.query;
    console.log("date range i  print " + options);
    // month year is look like 4 and 2025 in numeric formated format


    // Convert to numbers to ensure proper handling
    const numericMonth = parseInt(month, 10);
    const numericYear = parseInt(year, 10);

    // Basic validation 
    if (isNaN(numericMonth) || numericMonth < 1 || numericMonth > 12 ||
      isNaN(numericYear) || numericYear < 2000 || numericYear > 2100) {
      return res.status(400).json({
        success: false,
        message: "Invalid month or year parameters"
      });
    }


    // 1. First, get all reporting groups from settings
    const reportingGroups = await db.ReportingGroup.findAll();

    // Extract group IDs for service call
    const reportingGroupIds = reportingGroups.map(group => group.id);

    // Extract group names for the desired array of strings
    const reportingGroupNames = reportingGroups.map(group => group.dataValues.groupname);

    if (!reportingGroupIds || reportingGroupIds.length === 0) {
      console.warn("No reporting groups found. Using empty array.");
    }
    const employeeDetails = await getAllEmployeesService();


    // 2. Get employees attendance data for the month by reporting groups from mysql
    const attendanceData = await attendanceService.getEmployeesAttendanceByMonthAndGroup(
      reportingGroupNames || [],
      numericYear,
      numericMonth
    );

    // get teh attedence data from the redis db also
    const redisData = await getRedisAttendanceData(numericYear, numericMonth, reportingGroupNames);

    // combine and get the final attendence data for comparision.
    const finalAttendanceData = combineAttendanceData(attendanceData, redisData);
    // 3. Get metrics data for the month
    const metricsData = await metricsService.fetchMetricsForMonthYear(numericMonth, numericYear);

    // Initialize empty metrics if not returned
    if (!metricsData) {
      console.warn(`No metrics data returned for month ${month}, year ${year}`);
    }


    // Initialize result variable
    let reportData = null;

    console.log(dateRange);
    console.log(reportType);
    // Main switch case for report types
    switch (reportType) {
      case 'Net Hr':
        reportData = await generateNetHrReport(finalAttendanceData, metricsData, numericMonth, numericYear, options, dateRange, employeeType, employeeDetails);
        break;

      case 'OT Hr':
        reportData = await generateOtHrReport(finalAttendanceData, metricsData, numericMonth, numericYear, options, dateRange, employeeType, employeeDetails);
        break;

      case 'Site expence':
        reportData = await generateSiteExpenseReport(finalAttendanceData, metricsData, numericMonth, numericYear, options, dateRange, employeeType, employeeDetails);
        break;

      case 'Evening shift':
        reportData = await generateEveningShiftReport(finalAttendanceData, metricsData, numericMonth, numericYear, options, dateRange, employeeType, employeeDetails);
        break;

      case 'Night shift':
        reportData = await generateNightShiftReport(finalAttendanceData, metricsData, numericMonth, numericYear, options, dateRange, employeeType, employeeDetails);
        break;

      case 'Absent':
        reportData = await generateAbsentReport(finalAttendanceData, metricsData, numericMonth, numericYear, options, dateRange, employeeType, employeeDetails);
        break;

      case 'Detailed Group Report':
        reportData = await generateDetailedGroupReport(finalAttendanceData, metricsData, numericMonth, numericYear, options, dateRange, employeeType, employeeDetails);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid report type",
        });
    }

    // Check if the report generation was successful
    if (!reportData.success) {
      return res.status(400).json({
        success: false,
        message: reportData.message || "Error generating report"
      });
    }

    // If there's no filepath (some reports might only return a message)
    if (!reportData.filepath) {
      return res.status(200).json({
        success: true,
        message: reportData.message
      });
    }
    // Send the file for download
    try {
      // Determine the content type based on the file extension
      const isZipFile = reportData.filename.toLowerCase().endsWith('.zip');
      
      // Set the appropriate Content-Type header
      if (isZipFile) {
        res.setHeader('Content-Type', 'application/zip');
      } else {
        // Default to Excel file type
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
      
      // Set the Content-Disposition header for download
      res.setHeader('Content-Disposition', `attachment; filename="${reportData.filename}"`);
    
      // Send the file
      return res.sendFile(reportData.filepath, { root: '/' }, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          return res.status(500).json({
            success: false,
            message: "Error downloading the report",
            error: err.message
          });
        }
      });
    } catch (error) {
      console.error("Error sending file:", error);
      return res.status(500).json({
        success: false,
        message: "Error processing the report file",
        error: error.message
      });
    }
    

  } catch (error) {
    console.error("Error generating dashboard reports:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate reports",
      error: error.message
    });
  }
}];

module.exports = exports;