const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const dayjs = require("dayjs");

async function generateFirstShiftReport(
    finalAttendanceData,
    metricsData,
    numericMonth,
    numericYear,
    options,
    dateRange,
    employeeType,
    employeeDetails
) {
    // Create new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("First Shift Report");

    // Parse date range
    const startDate = new Date(dateRange[0]);
    const endDate = new Date(dateRange[1]);

    // Format dates properly for display
    const formattedStartDate = dayjs(startDate).format("DD-MM-YYYY");
    const formattedEndDate = dayjs(endDate).format("DD-MM-YYYY");

    // Format dates for header display
    const headerStartDate = dayjs(startDate).format("DD-MM-YYYY");
    const headerEndDate = dayjs(endDate).format("DD-MM-YYYY");

    // Format dates for filename in YYYYMMDD format
    const fileStartDate = dayjs(startDate).format("YYYYMMDD");
    const fileEndDate = dayjs(endDate).format("YYYYMMDD");

    // Generate array of dates in range
    const dateArray = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dateArray.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Filter employees who have at least one first shift in the date range
    let firstShiftEmployees = [];

    // Filter attendance data based on employeeType and date range
    let filteredAttendanceData = finalAttendanceData.filter((record) => {
        const recordDate = new Date(record.attendance_date);
        return (
            record.shift_type === "1S" &&
            recordDate >= startDate &&
            recordDate <= endDate
        );
    });

    // Filter by employee type
    if (employeeType === "Faulty Employees") {
        // Find employees with faulty data (OT or Network hours differences)
        const faultyEmployeeIds = new Set();

        filteredAttendanceData.forEach((record) => {
            const employeeId = record.employee_id;
            const attendanceDate = record.attendance_date;
            const dateStr = dayjs(new Date(attendanceDate)).format("DD");

            // Find corresponding metrics data for this employee
            const employeeMetrics = metricsData.find((metric) => {
                const employeeDetail = employeeDetails.find(
                    (emp) => emp.dataValues.employee_id === employeeId
                );
                return (
                    employeeDetail &&
                    metric.dataValues.punch_code ===
                        employeeDetail.dataValues.punch_code
                );
            });

            if (employeeMetrics) {
                const networkHoursArray = JSON.parse(
                    employeeMetrics.dataValues.network_hours
                );
                const overtimeHoursArray = JSON.parse(
                    employeeMetrics.dataValues.overtime_hours
                );

                // Find the specific date's hours
                const networkHoursObj = networkHoursArray.find(
                    (item) => item.date === dateStr
                );
                const overtimeHoursObj = overtimeHoursArray.find(
                    (item) => item.date === dateStr
                );

                if (networkHoursObj && overtimeHoursObj) {
                    const metricsNetHours = parseFloat(networkHoursObj.hours);
                    const metricsOtHours = parseFloat(overtimeHoursObj.hours);
                    const attendanceNetHours = record.network_hours;
                    const attendanceOtHours = record.overtime_hours;

                    // Check if there's a discrepancy
                    if (
                        Math.abs(metricsNetHours - attendanceNetHours) > 0.25 ||
                        Math.abs(metricsOtHours - attendanceOtHours) > 0.25
                    ) {
                        faultyEmployeeIds.add(employeeId);
                    }
                }
            }
        });

        filteredAttendanceData = filteredAttendanceData.filter((record) =>
            faultyEmployeeIds.has(record.employee_id)
        );
    } else if (employeeType === "New Employees") {
        // Filter only new employees
        const newEmployeeIds = employeeDetails
            .filter((emp) => emp.dataValues.punch_code.toLowerCase() === "new")
            .map((emp) => emp.dataValues.employee_id);

        filteredAttendanceData = filteredAttendanceData.filter((record) =>
            newEmployeeIds.includes(record.employee_id)
        );
    }

    // Get unique employee IDs from filtered attendance data
    const uniqueEmployeeIds = [
        ...new Set(filteredAttendanceData.map((record) => record.employee_id)),
    ];

    // Get employee details for these IDs
    firstShiftEmployees = employeeDetails.filter(
        (emp) =>
            uniqueEmployeeIds.includes(emp.dataValues.employee_id) &&
            emp.dataValues.status === "active" // or whatever your active status value is
    );

    // Set up worksheet columns based on options
    const headerRow = [];
    const headerRow2 = [];

    // Add employee info columns
    headerRow.push("Sr. No.");
    headerRow.push("Punch Code");
    headerRow.push("Name");
    headerRow.push("Designation");
    headerRow.push("Department");
    headerRow.push("Reporting Group");

    headerRow2.push("");
    headerRow2.push("");
    headerRow2.push("");
    headerRow2.push("");
    headerRow2.push("");
    headerRow2.push("");

    // Add date columns based on options
    dateArray.forEach((date) => {
        const dateStr = dayjs(date).format("DD-MM");

        if (options.includes("count") && !options.includes("remarks")) {
            headerRow.push(dateStr);
            headerRow2.push("First Shift Count");
        } else if (options.includes("count") && options.includes("remarks")) {
            headerRow.push(dateStr);
            headerRow.push("");
            headerRow2.push("First Shift Count");
            headerRow2.push("Comment");
        } else if (options.includes("hours") && !options.includes("remarks")) {
            headerRow.push(dateStr);
            headerRow.push("");
            headerRow2.push("Net Hr");
            headerRow2.push("OT Hr");
        } else if (
            options === "remarks" ||
            (options.includes("hours") && options.includes("remarks"))
        ) {
            headerRow.push(dateStr);
            headerRow.push("");
            headerRow.push("");
            headerRow2.push("Net Hr");
            headerRow2.push("OT Hr");
            headerRow2.push("Comment");
        }
    });

    // Add total column
    headerRow.push("Total");

    // For count option, show "Count" in the total column, otherwise show "Net Hr"
    if (options.includes("count") && !options.includes("hours")) {
        headerRow2.push("Count");
    } else {
        headerRow2.push("Net Hr");

        if (options.includes("hours")) {
            headerRow.push("");
            headerRow2.push("OT Hr");
        }
    }

    // Add main title row at the top
    const reportTitle = `First Shift Report (${headerStartDate} to ${headerEndDate})`;
    worksheet.addRow([reportTitle]);

    // Merge cells for the main title
    worksheet.mergeCells(1, 1, 1, headerRow.length);

    // Style the main title
    const titleCell = worksheet.getCell(1, 1);
    titleCell.font = {
        bold: true,
        size: 20,
    };
    titleCell.alignment = {
        horizontal: "center",
        vertical: "middle",
    };

    // Set the row height for the title
    worksheet.getRow(1).height = 30;

    // Add headers to worksheet
    worksheet.addRow(headerRow);
    worksheet.addRow(headerRow2);

    // Merge cells for date headers
    let colIndex = 7; // Starting after the employee info columns
    dateArray.forEach(() => {
        if (options.includes("count") && !options.includes("remarks")) {
            worksheet.mergeCells(2, colIndex, 2, colIndex);
            colIndex += 1;
        } else if (options.includes("count") && options.includes("remarks")) {
            worksheet.mergeCells(2, colIndex, 2, colIndex + 1);
            colIndex += 2;
        } else if (options.includes("hours") && !options.includes("remarks")) {
            worksheet.mergeCells(2, colIndex, 2, colIndex + 1);
            colIndex += 2;
        } else if (
            options === "remarks" ||
            (options.includes("hours") && options.includes("remarks"))
        ) {
            worksheet.mergeCells(2, colIndex, 2, colIndex + 2);
            colIndex += 3;
        }
    });

    // Merge total header
    if (options.includes("hours")) {
        worksheet.mergeCells(2, colIndex, 2, colIndex + 1);
    }

    // Add data rows
    const dataRows = [];
    const totalsByDate = {};

    // Initialize totals
    dateArray.forEach((date) => {
        const formattedDate = dayjs(date).format("YYYY-MM-DD");
        totalsByDate[formattedDate] = { netHr: 0, otHr: 0, count: 0 };
    });

    // Add total row at the end
    let grandTotalNetHr = 0;
    let grandTotalOtHr = 0;

    // Add employee rows
    firstShiftEmployees.forEach((employee, index) => {
        const employeeId = employee.dataValues.employee_id;
        const employeePunchCode = employee.dataValues.punch_code || "";
        const employeeName = employee.dataValues.name || "";
        const employeeDesignation = employee.dataValues.designation || "";
        const employeeDepartment = employee.dataValues.department || "";
        const employeeReportingGroup =
            employee.dataValues.reporting_group || "";

        const rowData = [
            index + 1, // Sr. No.
            employeePunchCode,
            employeeName,
            employeeDesignation,
            employeeDepartment,
            employeeReportingGroup,
        ];

        let employeeTotalNetHr = 0;
        let employeeTotalOtHr = 0;

        dateArray.forEach((date) => {
            const formattedDate = dayjs(date).format("YYYY-MM-DD");
            const dateStr = dayjs(date).format("DD");

            // Find attendance record for this employee and date
            const attendanceRecord = filteredAttendanceData.find(
                (record) =>
                    record.employee_id === employeeId &&
                    record.attendance_date === formattedDate
            );

            // Find metrics data for this employee
            const employeeMetrics = metricsData.find(
                (metric) =>
                    metric.dataValues.punch_code ===
                    employee.dataValues.punch_code
            );

            let netHr = 0;
            let otHr = 0;
            let comment = "";
            let hasDay = 0;
            let isFaulty = false;

            if (attendanceRecord) {
                netHr = attendanceRecord.network_hours || 0;
                otHr = attendanceRecord.overtime_hours || 0;
                comment = attendanceRecord.comment || "";
                hasDay = attendanceRecord.shift_type === "1S" ? 1 : 0;

                // Calculate totals
                employeeTotalNetHr += netHr;
                employeeTotalOtHr += otHr;
                totalsByDate[formattedDate].netHr += netHr;
                totalsByDate[formattedDate].otHr += otHr;
                totalsByDate[formattedDate].count += hasDay;

                // Check if data is faulty
                if (employeeMetrics) {
                    const networkHoursArray = JSON.parse(
                        employeeMetrics.dataValues.network_hours
                    );
                    const overtimeHoursArray = JSON.parse(
                        employeeMetrics.dataValues.overtime_hours
                    );

                    const networkHoursObj = networkHoursArray.find(
                        (item) => item.date === dateStr
                    );
                    const overtimeHoursObj = overtimeHoursArray.find(
                        (item) => item.date === dateStr
                    );

                    if (networkHoursObj && overtimeHoursObj) {
                        const metricsNetHours = parseFloat(
                            networkHoursObj.hours
                        );
                        const metricsOtHours = parseFloat(
                            overtimeHoursObj.hours
                        );

                        if (
                            Math.abs(metricsNetHours - netHr) > 0.25 ||
                            Math.abs(metricsOtHours - otHr) > 0.25
                        ) {
                            isFaulty = true;
                        }
                    }
                }
            }

            // Add data based on options
            if (options.includes("count") && !options.includes("remarks")) {
                rowData.push(hasDay);
            } else if (
                options.includes("count") &&
                options.includes("remarks")
            ) {
                rowData.push(hasDay);
                rowData.push(comment);
            } else if (
                options.includes("hours") &&
                !options.includes("remarks")
            ) {
                rowData.push(netHr);
                rowData.push(otHr);
            } else if (
                options === "remarks" ||
                (options.includes("hours") && options.includes("remarks"))
            ) {
                rowData.push(netHr);
                rowData.push(otHr);
                rowData.push(comment);
            }
        });

        // Add employee totals
        if (options.includes("count") && !options.includes("hours")) {
            // For count option, calculate the total number of first shifts
            const totalDayCount = dateArray.reduce((total, date) => {
                const formattedDate = dayjs(date).format("YYYY-MM-DD");
                const attendanceRecord = filteredAttendanceData.find(
                    (record) =>
                        record.employee_id === employeeId &&
                        record.attendance_date === formattedDate &&
                        record.shift_type === "1S"
                );
                return total + (attendanceRecord ? 1 : 0);
            }, 0);
            rowData.push(totalDayCount);
        } else {
            rowData.push(employeeTotalNetHr);
            if (options.includes("hours")) {
                rowData.push(employeeTotalOtHr);
            }
        }

        grandTotalNetHr += employeeTotalNetHr;
        grandTotalOtHr += employeeTotalOtHr;

        dataRows.push(rowData);
    });

    // Add data rows to worksheet
    dataRows.forEach((row) => {
        worksheet.addRow(row);
    });

    // Add Total row
    const totalRow = ["Total", "", "", "", "", ""];

    // Calculate grand total of first shift counts
    let grandTotalDayCount = 0;

    dateArray.forEach((date) => {
        const formattedDate = dayjs(date).format("YYYY-MM-DD");

        if (options.includes("count") && !options.includes("remarks")) {
            totalRow.push(totalsByDate[formattedDate].count);
            grandTotalDayCount += totalsByDate[formattedDate].count;
        } else if (options.includes("count") && options.includes("remarks")) {
            totalRow.push(totalsByDate[formattedDate].count);
            grandTotalDayCount += totalsByDate[formattedDate].count;
            totalRow.push("");
        } else if (options.includes("hours") && !options.includes("remarks")) {
            totalRow.push(totalsByDate[formattedDate].netHr);
            totalRow.push(totalsByDate[formattedDate].otHr);
        } else if (
            options === "remarks" ||
            (options.includes("hours") && options.includes("remarks"))
        ) {
            totalRow.push(totalsByDate[formattedDate].netHr);
            totalRow.push(totalsByDate[formattedDate].otHr);
            totalRow.push("");
        }
    });

    // Add grand totals
    if (options.includes("count") && !options.includes("hours")) {
        totalRow.push(grandTotalDayCount);
    } else {
        totalRow.push(grandTotalNetHr);
        if (options.includes("hours")) {
            totalRow.push(grandTotalOtHr);
        }
    }

    worksheet.addRow(totalRow);

    // Set custom column widths based on content type
    const colCount = worksheet.columnCount;
    for (let i = 1; i <= colCount; i++) {
        const col = worksheet.getColumn(i);

        // Employee info columns
        if (i <= 6) {
            switch (i) {
                case 1:
                    col.width = 6;
                    break; // Sr. No.
                case 2:
                    col.width = 10;
                    break; // Punch Code
                case 3:
                    col.width = 30;
                    break; // Name
                case 4:
                    col.width = 18;
                    break; // Designation
                case 5:
                    col.width = 18;
                    break; // Department
                case 6:
                    col.width = 18;
                    break; // Reporting Group
            }
        }
        // Hours and remarks columns
        else {
            const columnIndex = i - 7;
            let columnsPerDate;

            if (options.includes("count") && !options.includes("remarks")) {
                columnsPerDate = 1;
            } else if (
                options.includes("count") &&
                options.includes("remarks")
            ) {
                columnsPerDate = 2;
            } else if (
                options.includes("hours") &&
                !options.includes("remarks")
            ) {
                columnsPerDate = 2;
            } else {
                columnsPerDate = 3;
            }

            const dateIndex = Math.floor(columnIndex / columnsPerDate);
            const columnTypeIndex = columnIndex % columnsPerDate;

            if (dateIndex < dateArray.length) {
                // For date columns
                if (options.includes("hours")) {
                    if (columnTypeIndex === 0) {
                        // Net Hr
                        col.width = 8;
                    } else if (columnTypeIndex === 1) {
                        // OT Hr
                        col.width = 8;
                    } else if (columnTypeIndex === 2) {
                        // Comment
                        col.width = 20;
                    }
                } else if (options.includes("count")) {
                    if (columnTypeIndex === 0) {
                        // Count
                        col.width = 10;
                    } else if (columnTypeIndex === 1) {
                        // Comment
                        col.width = 20;
                    }
                }
            } else {
                // For total columns
                if (options.includes("hours")) {
                    if ((i - 7) % 2 === 0) {
                        // Net Hr total
                        col.width = 12;
                    } else {
                        // OT Hr total
                        col.width = 12;
                    }
                } else {
                    col.width = 12; // Count total
                }
            }
        }
    }

    // Formatting all cells
    const totalRowsCount = dataRows.length + 4; // Title + headers + data rows + total row
    const totalColumnsCount = worksheet.columnCount;

    // Day apply borders to all cells in the data area
    for (let i = 2; i <= totalRowsCount; i++) {
        for (let j = 1; j <= totalColumnsCount; j++) {
            const cell = worksheet.getCell(i, j);

            // Apply borders
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };

            // Format numbers to display with 2 decimal places
            if (
                i > 3 &&
                options.includes("hours") &&
                j > 6 &&
                j <= totalColumnsCount
            ) {
                const colOffset =
                    (j - 7) % (options.includes("remarks") ? 3 : 2);
                if (colOffset === 0 || colOffset === 1) {
                    // Net Hr or OT Hr columns
                    if (typeof cell.value === "number") {
                        cell.numFmt = "0.00";
                    }
                }
            }

            // Center align certain cells
            if (i <= 3 || j === 1 || j === 2) {
                cell.alignment = { horizontal: "center", vertical: "middle" };
            }

            // Right align hour values
            if (i > 3 && options.includes("hours") && j > 6) {
                const colOffset =
                    (j - 7) % (options.includes("remarks") ? 3 : 2);
                if (colOffset === 0 || colOffset === 1) {
                    // Net Hr or OT Hr columns
                    cell.alignment = {
                        horizontal: "right",
                        vertical: "middle",
                    };
                }
            }
        }
    }

    // Make headers bold
    for (let j = 1; j <= totalColumnsCount; j++) {
        const headerCell1 = worksheet.getCell(2, j);
        const headerCell2 = worksheet.getCell(3, j);
        headerCell1.font = { bold: true };
        headerCell2.font = { bold: true };
    }

    // Make total row bold
    const totalRowNum = totalRowsCount;
    for (let j = 1; j <= totalColumnsCount; j++) {
        const cell = worksheet.getCell(totalRowNum, j);
        cell.font = { bold: true };
    }

    // Add heavier border around the table
    for (let i = 2; i <= totalRowsCount; i++) {
        // Left edge
        worksheet.getCell(i, 1).border.left = { style: "medium" };
        // Right edge
        worksheet.getCell(i, totalColumnsCount).border.right = {
            style: "medium",
        };
    }

    for (let j = 1; j <= totalColumnsCount; j++) {
        // Top edge of headers
        worksheet.getCell(2, j).border.top = { style: "medium" };
        // Bottom edge of headers
        worksheet.getCell(3, j).border.bottom = { style: "medium" };
        // Bottom edge of table
        worksheet.getCell(totalRowsCount, j).border.bottom = {
            style: "medium",
        };
    }

    // Highlight faulty cells with light red background
    if (options.includes("hours")) {
        for (let i = 4; i < totalRowsCount; i++) {
            const employeeIdx = i - 4;
            if (employeeIdx < firstShiftEmployees.length) {
                const employeeId =
                    firstShiftEmployees[employeeIdx].dataValues.employee_id;

                for (let dateIdx = 0; dateIdx < dateArray.length; dateIdx++) {
                    const date = dateArray[dateIdx];
                    const formattedDate = dayjs(date).format("YYYY-MM-DD");
                    const dateStr = dayjs(date).format("DD");

                    // Find attendance record for this employee and date
                    const attendanceRecord = filteredAttendanceData.find(
                        (record) =>
                            record.employee_id === employeeId &&
                            record.attendance_date === formattedDate
                    );

                    if (attendanceRecord) {
                        // Find metrics data for this employee
                        const employeeMetrics = metricsData.find((metric) => {
                            const empDetail = firstShiftEmployees.find(
                                (emp) =>
                                    emp.dataValues.employee_id === employeeId
                            );
                            return (
                                empDetail &&
                                metric.dataValues.punch_code ===
                                    empDetail.dataValues.punch_code
                            );
                        });

                        if (employeeMetrics) {
                            const networkHoursArray = JSON.parse(
                                employeeMetrics.dataValues.network_hours
                            );
                            const overtimeHoursArray = JSON.parse(
                                employeeMetrics.dataValues.overtime_hours
                            );

                            const networkHoursObj = networkHoursArray.find(
                                (item) => item.date === dateStr
                            );
                            const overtimeHoursObj = overtimeHoursArray.find(
                                (item) => item.date === dateStr
                            );

                            if (networkHoursObj && overtimeHoursObj) {
                                const metricsNetHours = parseFloat(
                                    networkHoursObj.hours
                                );
                                const metricsOtHours = parseFloat(
                                    overtimeHoursObj.hours
                                );
                                const attendanceNetHours =
                                    attendanceRecord.network_hours || 0;
                                const attendanceOtHours =
                                    attendanceRecord.overtime_hours || 0;

                                // Calculate column positions for Net Hr and OT Hr
                                let startCol = 7;
                                for (let d = 0; d < dateIdx; d++) {
                                    startCol += options.includes("remarks")
                                        ? 3
                                        : 2;
                                }

                                // Highlight Net Hr cell if faulty
                                if (
                                    Math.abs(
                                        metricsNetHours - attendanceNetHours
                                    ) > 0.25
                                ) {
                                    const netHrCell = worksheet.getCell(
                                        i,
                                        startCol
                                    );
                                    netHrCell.fill = {
                                        type: "pattern",
                                        pattern: "solid",
                                        fgColor: { argb: "FFFFCCCC" }, // Light red
                                    };
                                }

                                // Highlight OT Hr cell if faulty
                                if (
                                    Math.abs(
                                        metricsOtHours - attendanceOtHours
                                    ) > 0.25
                                ) {
                                    const otHrCell = worksheet.getCell(
                                        i,
                                        startCol + 1
                                    );
                                    otHrCell.fill = {
                                        type: "pattern",
                                        pattern: "solid",
                                        fgColor: { argb: "FFFFCCCC" }, // Light red
                                    };
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Create directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), "reports");
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const optionsStr = Array.isArray(options) ? options.join("_") : options;

    // Generate filename in the format similar to "first_report_All Employees_20250401_to_20250407.xlsx"
    const reportType = "First_report";
    const fileName = `${reportType}_${employeeType.replace(
        /\s+/g,
        "_"
    )}_${fileStartDate}_to_${fileEndDate}_${optionsStr}.xlsx`;
    const filePath = path.join(reportsDir, fileName);

    // Save file
    await workbook.xlsx.writeFile(filePath);

    return {
        success: true,
        filepath: filePath,
        filename: fileName,
        message: `First shift report generated successfully for employees.`,
        type: "file", // Add this to indicate it's a file response
    };
}

module.exports = generateFirstShiftReport;
