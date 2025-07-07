const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const dayjs = require("dayjs");

async function generateOtHrReport(
    finalAttendanceData,
    metricsData,
    month,
    year,
    options,
    dateRange,
    employeeType,
    employeeDetails
) {
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
    } catch (error) {
        console.error("Error parsing dates:", error);
        throw error;
    }

    // Create an array of all dates in the range
    const allDates = [];
    let currentDate = startDate;
    // Use dayjs's startOf('day') to ensure we're working with dates without time component
    currentDate = currentDate.startOf("day");
    endDate = endDate.startOf("day");

    while (currentDate.isBefore(endDate)) {
        allDates.push(currentDate);
        currentDate = currentDate.add(1, "day");
    }

    // Process and organize attendance data by employee and date
    const attendanceByEmployee = {};

    finalAttendanceData.forEach((attendance) => {
        const employeeId = attendance.employee_id;

        if (!attendanceByEmployee[employeeId]) {
            attendanceByEmployee[employeeId] = {};
        }

        const attendanceDate = dayjs(attendance.attendance_date).format(
            "YYYY-MM-DD"
        );
        attendanceByEmployee[employeeId][attendanceDate] = {
            overtimeHours: attendance.overtime_hours, // Use overtime hours for OT report
            comment: attendance.comment || "",
            reportingGroup: attendance.reporting_group || "",
        };
    });

    // Process metrics data
    const metricsByDate = {};

    if (metricsData && metricsData.dataValues) {
        try {
            // Parse the overtime_hours from JSON string
            if (metricsData.dataValues.overtime_hours) {
                const overtimeHoursJson = JSON.parse(
                    metricsData.dataValues.overtime_hours
                );

                overtimeHoursJson.forEach((item) => {
                    // Format to ensure consistent date format (assuming "DD" format in metrics)
                    const dateObj = dayjs(`${year}-${month}-${item.date}`);
                    const dateStr = dateObj.format("YYYY-MM-DD");

                    if (!metricsByDate[dateStr]) {
                        metricsByDate[dateStr] = {};
                    }

                    metricsByDate[dateStr].overtimeHours =
                        parseFloat(item.hours) || 0;
                });
            }
        } catch (error) {
            console.error("Error parsing metrics data:", error);
        }
    }

    // Extract unique employee IDs from attendance data
    const uniqueEmployeeIds = [
        ...new Set(finalAttendanceData.map((a) => a.employee_id)),
    ];

    // Prepare employee data
    let employeesData = [];
    if (Array.isArray(employeeDetails) && employeeDetails.length > 0) {
        employeesData = employeeDetails.filter(
            (employee) =>
                employee.status === "active" ||
                employee.dataValues?.status === "active"
        );
    } else {
        // Create simple employee objects if detailed info not provided
        uniqueEmployeeIds.forEach((id) => {
            employeesData.push({
                dataValues: {
                    employee_id: id,
                    name: `Employee ${id}`,
                    department: "",
                    punch_code: "",
                    designation: "",
                    reporting_group: "",
                },
            });
        });
    }

    // Filter employees based on employeeType
    let filteredEmployees = [...employeesData];

    if (employeeType === "New Employees") {
        filteredEmployees = employeesData.filter((emp) => {
            if (!emp || !emp.dataValues) return false;
            return (
                emp.dataValues.punch_code &&
                emp.dataValues.punch_code.toLowerCase() === "new"
            );
        });
    } else if (employeeType === "Faulty Employees") {
        // Filter employees with discrepancies between actual and expected overtime hours
        filteredEmployees = employeesData.filter((emp) => {
            if (!emp || !emp.dataValues) return false;

            const employeeId = emp.dataValues.employee_id;
            let hasFault = false;

            // Check each date for discrepancies
            for (const date of allDates) {
                const dateStr = date.format("YYYY-MM-DD");
                const actualHours =
                    attendanceByEmployee[employeeId]?.[dateStr]
                        ?.overtimeHours || 0;
                const expectedHours =
                    metricsByDate[dateStr]?.overtimeHours || 0;

                // Check if difference is more than 0.25 hours
                if (Math.abs(actualHours - expectedHours) > 0.25) {
                    hasFault = true;
                    break;
                }
            }

            return hasFault;
        });
    }

    // If no employees match the criteria, return early
    if (filteredEmployees.length === 0) {
        return {
            success: true,
            message: "No employees match the selected criteria for the report.",
        };
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("OT Hours Report");

    // Check for options
    const optionsString = typeof options === "string" ? options : "";
    const includeRemarks = optionsString.includes("remarks");

    // Define base columns (employee info)
    const employeeInfoColumns = [
        { header: "Sr. No.", width: 7 },
        { header: "Punch Code", width: 15 },
        { header: "Name", width: 25 },
        { header: "Designation", width: 15 },
        { header: "Department", width: 15 },
        { header: "Reporting Group", width: 15 },
    ];

    // Create columns array
    const columns = [...employeeInfoColumns];

    // Add date columns
    if (includeRemarks) {
        // For each date, add two columns: OT Hr and Comment
        allDates.forEach((date) => {
            columns.push({ header: date.format("DD-MM"), width: 10 }); // OT Hr column
            columns.push({ header: "", width: 20 }); // Comment column - header will be set later
        });
        // Add total column
        columns.push({ header: "Total", width: 15 });
    } else {
        // Just add one column per date for OT Hr
        allDates.forEach((date) => {
            columns.push({ header: date.format("DD-MM"), width: 10 });
        });
        // Add total column
        columns.push({ header: "Total", width: 15 });
    }

    // Set the columns
    worksheet.columns = columns;

    // Style the title and headers
    // Add title row at the top
    worksheet.insertRow(1, [
        `OT Hours Report (${startDate.format("DD-MM-YYYY")} to ${endDate.format(
            "DD-MM-YYYY"
        )})`,
    ]);
    const titleRow = worksheet.getRow(1);
    titleRow.height = 30;
    titleRow.font = { bold: true, size: 14 };
    titleRow.alignment = { horizontal: "center", vertical: "middle" };

    // Merge title cells
    worksheet.mergeCells(1, 1, 1, columns.length);

    // Add medium border around title
    titleRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
            top: { style: "medium" },
            left: { style: "medium" },
            bottom: { style: "medium" },
            right: { style: "medium" },
        };
    });

    // Style the header row (now row 2 after inserting title)
    const headerRow = worksheet.getRow(2);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Add medium borders to header
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
            top: { style: "medium" },
            left: { style: colNumber === 1 ? "medium" : "thin" },
            bottom: { style: "medium" },
            right: { style: colNumber === columns.length ? "medium" : "thin" },
        };
    });

    // If remarks are included, add a second header row for OT Hr / Comment labels
    if (includeRemarks) {
        // Create subheader row
        const subheaderRow = worksheet.insertRow(3, []);

        // Fill the employee info cells with empty values
        for (let i = 0; i < 6; i++) {
            subheaderRow.getCell(i + 1).value = "";
        }

        // Set OT Hr and Comment labels
        let columnIndex = 7; // Start after employee info columns
        allDates.forEach(() => {
            subheaderRow.getCell(columnIndex).value = "OT Hr";
            subheaderRow.getCell(columnIndex + 1).value = "Comment";
            columnIndex += 2;
        });

        // Add Total label
        subheaderRow.getCell(columnIndex).value = "";

        // Style the subheader row
        subheaderRow.font = { bold: true };
        subheaderRow.alignment = { vertical: "middle", horizontal: "center" };

        // Apply borders
        subheaderRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            cell.border = {
                top: { style: "thin" },
                left: { style: colNumber === 1 ? "medium" : "thin" },
                bottom: { style: "thin" },
                right: {
                    style: colNumber === columns.length ? "medium" : "thin",
                },
            };
        });

        // Merge date headers in row 2 to span OT Hr and Comment columns
        columnIndex = 7; // Reset to start of date columns
        for (let i = 0; i < allDates.length; i++) {
            worksheet.mergeCells(2, columnIndex, 2, columnIndex + 1);
            columnIndex += 2;
        }

        // Merge employee info cells in subheader row
        for (let i = 1; i <= 6; i++) {
            worksheet.mergeCells(2, i, 3, i);
        }

        // Merge Total cell
        worksheet.mergeCells(2, columnIndex, 3, columnIndex);
    }

    // Get the starting row for data (depends on if we have subheaders)
    const dataStartRow = includeRemarks ? 4 : 3;

    // Add data rows
    filteredEmployees.forEach((employee, index) => {
        let emp;
        if (employee.dataValues) {
            emp = employee.dataValues;
        } else {
            emp = employee;
        }

        const employeeId = emp.employee_id;

        // Base row data with employee info
        const rowData = [
            index + 1, // Sr. No.
            emp.punch_code || "",
            emp.name || `Employee ${employeeId}`,
            emp.designation || "",
            emp.department || "",
            emp.reporting_group || "",
        ];

        // Add data for each date
        if (includeRemarks) {
            // Add hours and comments for each date
            let totalHours = 0;
            allDates.forEach((date) => {
                const dateStr = date.format("YYYY-MM-DD");
                const actualHours =
                    attendanceByEmployee[employeeId]?.[dateStr]
                        ?.overtimeHours || 0;
                const comment =
                    attendanceByEmployee[employeeId]?.[dateStr]?.comment || "";
                const expectedHours =
                    metricsByDate[dateStr]?.overtimeHours || 0;

                totalHours += parseFloat(actualHours) || 0;

                rowData.push(actualHours.toFixed(2)); // OT hours
                rowData.push(comment); // Comment
            });

            // Add total hours
            rowData.push(totalHours.toFixed(2)); // 2 decimal places
        } else {
            // Just add hours
            let totalHours = 0;
            allDates.forEach((date) => {
                const dateStr = date.format("YYYY-MM-DD");
                const actualHours =
                    attendanceByEmployee[employeeId]?.[dateStr]
                        ?.overtimeHours || 0;

                totalHours += parseFloat(actualHours) || 0;

                rowData.push(actualHours.toFixed(2));
            });

            // Add total hours
            rowData.push(totalHours.toFixed(2)); // 2 decimal places
        }

        // Add row to worksheet
        const row = worksheet.addRow(rowData);

        // Center align numeric columns
        row.getCell(1).alignment = { horizontal: "center" }; // Sr. No.

        // Apply borders and styles to all cells
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            // Apply standard borders
            cell.border = {
                top: { style: "thin" },
                left: { style: colNumber === 1 ? "medium" : "thin" },
                bottom: { style: "thin" },
                right: {
                    style: colNumber === columns.length ? "medium" : "thin",
                },
            };

            // For hours columns when not using remarks
            if (!includeRemarks && colNumber >= 7) {
                // Hours columns start at col 7
                cell.alignment = { horizontal: "center" };

                // Force Excel to display exactly 2 decimal places
                if (cell.value) {
                    cell.numFmt = "0.00"; // Force 2 decimal places in Excel
                }
            }
            // With remarks, handle hours and comments separately
            else if (includeRemarks && colNumber >= 7) {
                const colOffset = colNumber - 7;
                const isHoursColumn = colOffset % 2 === 0; // even offset (0, 2, 4...) = hours
                const isTotalColumn = colNumber === columns.length; // Last column is total

                if (isHoursColumn || isTotalColumn) {
                    // Center hours and total
                    cell.alignment = { horizontal: "center" };

                    // For hours cells, we can also set number format to ensure Excel displays exactly 2 decimal places
                    if (cell.value) {
                        cell.numFmt = "0.00"; // Force 2 decimal places in Excel
                    }
                } else {
                    // Left align comments
                    cell.alignment = { horizontal: "left" };

                    // Highlight comments that start with "site"
                    if (
                        cell.value &&
                        cell.value.toString().toLowerCase().startsWith("site")
                    ) {
                        cell.fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: { argb: "FFDEB887" }, // Light brown
                        };
                    }
                }
            }
        });
    });

    // Add a summary row for total hours by date
    // Prepare summary row data
    const summaryRowData = ["Total OT Hours", "", "", "", "", ""];
    const totalsByDate = {};

    // Initialize totals for each date
    if (includeRemarks) {
        // With remarks, we need to skip comment columns when calculating totals
        allDates.forEach((date) => {
            const dateStr = date.format("YYYY-MM-DD");
            totalsByDate[dateStr] = 0;
        });

        // Calculate totals
        filteredEmployees.forEach((employee) => {
            const emp = employee.dataValues || employee;
            const employeeId = emp.employee_id;

            allDates.forEach((date) => {
                const dateStr = date.format("YYYY-MM-DD");
                // Get exact hours value from source data
                const hours =
                    attendanceByEmployee[employeeId]?.[dateStr]
                        ?.overtimeHours || 0;
                // Use original value without any processing
                totalsByDate[dateStr] += Number(hours);
            });
        });

        // Add totals to summary row - use raw values
        allDates.forEach((date) => {
            const dateStr = date.format("YYYY-MM-DD");
            // Use the raw totals without formatting
            summaryRowData.push(totalsByDate[dateStr]);
            summaryRowData.push(""); // Empty comment cell
        });
    } else {
        // Without remarks, all columns are hours
        allDates.forEach((date) => {
            const dateStr = date.format("YYYY-MM-DD");
            totalsByDate[dateStr] = 0;
        });

        // Calculate totals
        filteredEmployees.forEach((employee) => {
            const emp = employee.dataValues || employee;
            const employeeId = emp.employee_id;

            allDates.forEach((date) => {
                const dateStr = date.format("YYYY-MM-DD");
                // Get exact hours value
                const hours =
                    attendanceByEmployee[employeeId]?.[dateStr]
                        ?.overtimeHours || 0;
                // Use original value
                totalsByDate[dateStr] += Number(hours);
            });
        });

        // Add totals to summary row - use raw values
        allDates.forEach((date) => {
            const dateStr = date.format("YYYY-MM-DD");
            summaryRowData.push(totalsByDate[dateStr]);
        });
    }

    // Calculate grand total
    const grandTotal = Object.values(totalsByDate).reduce(
        (sum, val) => sum + val,
        0
    );
    summaryRowData.push(grandTotal); // Use raw value

    // Add summary row to worksheet
    const summaryRow = worksheet.addRow(summaryRowData);
    summaryRow.font = { bold: true };

    // Apply styling to summary row
    summaryRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber === 1) {
            // First column
            cell.border = {
                top: { style: "medium" },
                left: { style: "medium" },
                bottom: { style: "medium" },
                right: { style: "thin" },
            };
        } else if (colNumber === columns.length) {
            // Last column
            cell.border = {
                top: { style: "medium" },
                left: { style: "thin" },
                bottom: { style: "medium" },
                right: { style: "medium" },
            };
        } else {
            // Middle columns
            cell.border = {
                top: { style: "medium" },
                left: { style: "thin" },
                bottom: { style: "medium" },
                right: { style: "thin" },
            };
        }

        // Center align the hour totals and apply number format
        if (
            (includeRemarks && (colNumber - 7) % 2 === 0 && colNumber >= 7) ||
            (!includeRemarks && colNumber >= 7)
        ) {
            cell.alignment = { horizontal: "center" };

            // Force Excel to display exactly 2 decimal places for numeric cells
            if (cell.value) {
                cell.numFmt = "0.00";
            }
        }
    });

    // If using remarks, merge the first cell across the first row
    if (includeRemarks) {
        // Only need to merge this one cell in summary row
        worksheet.mergeCells(summaryRow.number, 1, summaryRow.number, 6);
    }

    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), "reports");
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Generate filename
    const startDateStr = startDate.format("YYYY-MM-DD");
    const endDateStr = endDate.format("YYYY-MM-DD");
    // Handle options whether it's a string or array
    const optionsStr = Array.isArray(options) ? options.join("_") : options;
    const employeeTypeStr =
        typeof employeeType === "string"
            ? employeeType.replace(/\s+/g, "_").toLowerCase()
            : "all";

    const filename = `ot_hr_report_${startDateStr}_to_${endDateStr}_${employeeTypeStr}_${optionsStr}.xlsx`;
    const filepath = path.join(reportsDir, filename);

    // Save the workbook
    await workbook.xlsx.writeFile(filepath);

    // Return the file path information
    return {
        success: true,
        filepath: filepath,
        filename: filename,
        message: `Absent report generated successfully for employees.`,
        type: "file", // Add this to indicate it's a file response
    };
}

module.exports = generateOtHrReport;
