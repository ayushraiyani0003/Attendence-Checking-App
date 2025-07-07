const db = require("../models/index");
const attendanceService = require("../services/attendenceService");
const metricsService = require("../services/metricsService");
const { getAllEmployeesService } = require("../services/employeeServices");
const { authenticateJWT, isAdmin } = require("../middlewares/authMiddleware");
const { getRedisAttendanceData } = require("../utils/getRedisAttendenceData");
const { combineAttendanceData } = require("../utils/combineAtt");
const { findMismatchesByGroup } = require("../utils/findMistamatch");
const {
    generateNetHrReport,
    generateOtHrReport,
    generateSiteExpenseReport,
    generateEveningShiftReport,
    generateNightShiftReport,
    generateDetailedGroupReport,
    generateAbsentReport,
    generateDayShiftReport,
    generateGeneralShiftReport,
} = require("../utils/report");

// Get graph data for the dashboard
exports.getDashboardGraphs = [
    async (req, res) => {
        try {
            // Get month and year from the request query
            let { month, year } = req.query;

            // If month and year are not provided, use current month and year
            if (!month || !year) {
                const currentDate = new Date();
                month = month || (currentDate.getMonth() + 1).toString();
                year = year || currentDate.getFullYear().toString();
            }

            // Convert to numbers to ensure proper handling
            const numericMonth = parseInt(month, 10);
            const numericYear = parseInt(year, 10);

            // Basic validation
            if (
                isNaN(numericMonth) ||
                numericMonth < 1 ||
                numericMonth > 12 ||
                isNaN(numericYear) ||
                numericYear < 2000 ||
                numericYear > 2100
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid month or year parameters",
                });
            }

            // Get raw dashboard data using helper function
            const rawData = await getData(numericMonth, numericYear);

            // Return successful response with data
            return res.status(200).json({
                success: true,
                data: rawData,
            });
        } catch (error) {
            console.error("Error fetching dashboard graph data:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch dashboard data",
                error: error.message,
            });
        }
    },
];

// Helper function to get dashboard data
const getData = async (month, year) => {
    // Check if requested date is in the future
    const currentDate = new Date();
    const requestedDate = new Date(year, month - 1, 1);

    if (requestedDate > currentDate) {
        console.log(
            `Requested future date ${month}-${year}, returning empty data`
        );
        return {
            warning: "Future date requested, no data available",
            mismatches: [],
        };
    }

    try {
        // 1. Get all reporting groups from settings
        const reportingGroups = await db.ReportingGroup.findAll();

        // Get all employees
        var employeeDetails = await getAllEmployeesService();

        // Filter for active employees with exactly 6 characters
        employeeDetails = employeeDetails.filter((employee) => {
            console.log(
                `Status: "${employee.status}", Length: ${employee.status?.length}
                Name: ${employee.punch_code}
                `
                // employee
                //Status: "resigned", Length: 8
                // Name: 500
                // this employee still display
                // i need only active employee not other
            );
            return employee.status === "active" && employee.status.length === 6;
        });

        // Check what's left after filtering
        console.log("Filtered employees:", employeeDetails.length);
        console.log(
            "Final statuses:",
            employeeDetails.map((emp) => emp.status)
        );

        // disply in console.log
        // ineed only details of the who have punch_code === 500
        employeeDetails500 = employeeDetails.filter(
            (employee) => employee.punch_code === "500"
        );

        console.log(employeeDetails500);

        // Extract group names for the desired array of strings
        const reportingGroupNames = reportingGroups.map(
            (group) => group.dataValues.groupname
        );

        if (!reportingGroupNames || reportingGroupNames.length === 0) {
            console.warn("No reporting groups found. Using empty array.");
        }

        // 2. Get employees attendance data for the month by reporting groups from mysql
        const attendanceData =
            await attendanceService.getEmployeesAttendanceByMonthAndGroup(
                reportingGroupNames || [],
                year,
                month,
                employeeDetails
            );

        // get the attendance data from the redis db also
        const redisData = await getRedisAttendanceData(
            year,
            month,
            reportingGroupNames
        );

        // If both data sources are empty, return early
        if (!attendanceData.length && (!redisData || !redisData.length)) {
            console.log(
                `No attendance data available for ${month}-${year} from either source`
            );
            return { warning: "No attendance data available", mismatches: [] };
        }

        // Safely combine the attendance data
        const finalAttendanceData = safelyCombineData(
            attendanceData,
            redisData
        );

        // 3. Get metrics data for the month
        const metricsData = await metricsService.fetchMetricsForMonthYear(
            month,
            year
        );

        // Initialize empty metrics if not returned
        if (!metricsData) {
            console.warn(
                `No metrics data returned for month ${month}, year ${year}`
            );
        }

        // 4. calculate the diff between the finalAttendanceData and metricsData
        const mismatchBygroup = findMismatchesByGroup(
            finalAttendanceData,
            metricsData
        );

        return mismatchBygroup;
    } catch (error) {
        console.error("Error in getData function:", error);
        throw error;
    }
};

// Safe data combination function to prevent inconsistent results
const safelyCombineData = (mysqlData, redisData) => {
    // If Redis data is empty or null, use only MySQL data
    if (!redisData || !redisData.length) {
        return mysqlData;
    }

    // If MySQL data is empty but Redis has data, use only Redis data
    if (!mysqlData.length && redisData.length) {
        // You may need to format Redis data to match MySQL format
        // This depends on your combineAttendanceData implementation
        return redisData;
    }

    // Both have data, use the original combine function
    return combineAttendanceData(mysqlData, redisData);
};

exports.getDashboardReports = [
    authenticateJWT,
    isAdmin,
    async (req, res) => {
        try {
            // Get parameters from the request query
            let { month, year, reportType, options, dateRange, employeeType } =
                req.query;
            // console.log(req.query);

            // Convert to numbers to ensure proper handling
            const numericMonth = parseInt(month, 10);
            const numericYear = parseInt(year, 10);

            // Basic validation
            if (
                isNaN(numericMonth) ||
                numericMonth < 1 ||
                numericMonth > 12 ||
                isNaN(numericYear) ||
                numericYear < 2000 ||
                numericYear > 2100
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid month or year parameters",
                });
            }

            // Check if requested date is in the future
            const currentDate = new Date();
            const requestedDate = new Date(numericYear, numericMonth - 1, 1);

            if (requestedDate > currentDate) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot generate reports for future dates",
                });
            }

            // 1. Get all reporting groups and employee details
            const reportingGroups = await db.ReportingGroup.findAll();
            const reportingGroupNames = reportingGroups.map(
                (group) => group.dataValues.groupname
            );
            const employeeDetails = await getAllEmployeesService();

            // 2. Get attendance data from both sources
            const attendanceData =
                await attendanceService.getEmployeesAttendanceByMonthAndGroup(
                    reportingGroupNames || [],
                    numericYear,
                    numericMonth,
                    employeeDetails
                );

            const redisData = await getRedisAttendanceData(
                numericYear,
                numericMonth,
                reportingGroupNames
            );

            // Safely combine the data to prevent inconsistencies
            const finalAttendanceData = safelyCombineData(
                attendanceData,
                redisData
            );

            // 3. Get metrics data for the month
            const metricsData = await metricsService.fetchMetricsForMonthYear(
                numericMonth,
                numericYear
            );

            // Initialize result variable
            let reportData = null;

            // Main switch case for report types
            switch (reportType) {
                case "Net Hr":
                    reportData = await generateNetHrReport(
                        finalAttendanceData,
                        metricsData,
                        numericMonth,
                        numericYear,
                        options,
                        dateRange,
                        employeeType,
                        employeeDetails
                    );
                    break;

                case "OT Hr":
                    reportData = await generateOtHrReport(
                        finalAttendanceData,
                        metricsData,
                        numericMonth,
                        numericYear,
                        options,
                        dateRange,
                        employeeType,
                        employeeDetails
                    );
                    break;

                case "Site expence":
                    reportData = await generateSiteExpenseReport(
                        finalAttendanceData,
                        metricsData,
                        numericMonth,
                        numericYear,
                        options,
                        dateRange,
                        employeeType,
                        employeeDetails
                    );
                    break;

                case "General Shift":
                    reportData = await generateGeneralShiftReport(
                        finalAttendanceData,
                        metricsData,
                        numericMonth,
                        numericYear,
                        options,
                        dateRange,
                        employeeType,
                        employeeDetails
                    );
                    break;
                case "First Shift":
                    reportData = await generateDayShiftReport(
                        finalAttendanceData,
                        metricsData,
                        numericMonth,
                        numericYear,
                        options,
                        dateRange,
                        employeeType,
                        employeeDetails
                    );
                    break;

                case "Second Shift":
                    reportData = await generateEveningShiftReport(
                        finalAttendanceData,
                        metricsData,
                        numericMonth,
                        numericYear,
                        options,
                        dateRange,
                        employeeType,
                        employeeDetails
                    );
                    break;

                case "Third Shift":
                    reportData = await generateNightShiftReport(
                        finalAttendanceData,
                        metricsData,
                        numericMonth,
                        numericYear,
                        options,
                        dateRange,
                        employeeType,
                        employeeDetails
                    );
                    break;

                case "Absent":
                    reportData = await generateAbsentReport(
                        finalAttendanceData,
                        metricsData,
                        numericMonth,
                        numericYear,
                        options,
                        dateRange,
                        employeeType,
                        employeeDetails
                    );
                    break;

                case "Detailed Group Report":
                    reportData = await generateDetailedGroupReport(
                        finalAttendanceData,
                        metricsData,
                        numericMonth,
                        numericYear,
                        options,
                        dateRange,
                        employeeType,
                        employeeDetails
                    );
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        message: "Invalid report type",
                    });
            }
            // console.log(reportData);

            // Check if the report generation was successful
            if (!reportData.success) {
                return res.status(400).json({
                    success: false,
                    message:
                        reportData.message ||
                        "Error generating report my message",
                });
            }

            // If there's no filepath (some reports might only return a message)
            if (!reportData.filepath) {
                return res.status(200).json({
                    success: true,
                    message: reportData.message,
                });
            }

            // Send the file for download
            try {
                // Determine the content type based on the file extension
                const isZipFile = reportData.filename
                    .toLowerCase()
                    .endsWith(".zip");

                // Set the appropriate Content-Type header
                if (isZipFile) {
                    res.setHeader("Content-Type", "application/zip");
                } else {
                    // Default to Excel file type
                    res.setHeader(
                        "Content-Type",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    );
                }

                // Set the Content-Disposition header for download
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${reportData.filename}"`
                );

                // Send the file
                return res.sendFile(
                    reportData.filepath,
                    { root: "/" },
                    (err) => {
                        if (err) {
                            console.error("Error sending file:", err);
                            return res.status(500).json({
                                success: false,
                                message: "Error downloading the report",
                                error: err.message,
                            });
                        }
                    }
                );
            } catch (error) {
                console.error("Error sending file:", error);
                return res.status(500).json({
                    success: false,
                    message: "Error processing the report file",
                    error: error.message,
                });
            }
        } catch (error) {
            console.error("Error generating dashboard reports:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to generate reports",
                error: error.message,
            });
        }
    },
];

module.exports = exports;
