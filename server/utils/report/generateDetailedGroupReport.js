const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const archiver = require('archiver');

/**
 * Generates detailed group reports for employee attendance
 */
async function generateDetailedGroupReport(finalAttendanceData, metricsData, numericMonth, numericYear, options, dateRange, employeeType, employeeDetails) {
    // Parse the options
    const optionsArray = options ? options.split(',') : [];
    const isMasterReport = optionsArray.includes('master');
    const isMistakeDate = optionsArray.includes('mistake date');
    const isSeparateDate = optionsArray.includes('separate date');
    const isNetOt = optionsArray.includes('net-ot');

    // Convert date range to Date objects
    const startDate = new Date(dateRange[0]);
    const endDate = new Date(dateRange[1]);

    // Create array of dates between start and end dates
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Format date range for display in report title
    const startDateDisplay = dayjs(startDate).format('DD-MM-YYYY');
    const endDateDisplay = dayjs(endDate).format('DD-MM-YYYY');
    const dateRangeDisplay = `(${startDateDisplay} to ${endDateDisplay})`;

    // Group employees by department
    const departmentGroups = {};

    employeeDetails.forEach(employee => {
        const dept = employee.dataValues.department || 'Unassigned';
        if (!departmentGroups[dept]) {
            departmentGroups[dept] = [];
        }
        departmentGroups[dept].push(employee);
    });

    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Format date range for filename
    const startDateStr = dayjs(startDate).format('YYYY-MM-DD');
    const endDateStr = dayjs(endDate).format('YYYY-MM-DD');
    const dateRangeStr = `${startDateStr}_to_${endDateStr}`;

    // Handle different report types based on options
    if (isMasterReport && isSeparateDate) {
        // Create separate files for each date with all departments combined
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        const zipFileName = `Date_Reports_All_Departments_${dateRangeStr}_${employeeType}_${optionsArray.join('_')}.zip`;
        const zipFilePath = path.join(reportsDir, zipFileName);
        const output = fs.createWriteStream(zipFilePath);

        archive.pipe(output);

        // Process each date
        for (const date of dates) {
            const dateStr = dayjs(date).format('YYYY-MM-DD');
            const singleDateDisplay = dayjs(date).format('DD-MM-YYYY');

            const reportResult = await createReportFile(
                `All_Departments_${singleDateDisplay}`,
                dateStr,
                employeeType,
                optionsArray.join('_'),
                employeeDetails,
                finalAttendanceData,
                metricsData,
                [date], // Single date array
                numericMonth,
                numericYear,
                null, // No specific department
                `(${singleDateDisplay})`, // Date display
                isMistakeDate,
                false, // Not separate date within this report
                isNetOt
            );

            // Add the file to the zip
            if (reportResult && reportResult.filepath) {
                archive.file(reportResult.filepath, { name: path.basename(reportResult.filepath) });
            }
        }

        // Finalize the zip file
        await new Promise((resolve, reject) => {
            archive.on('error', reject);
            output.on('close', resolve);
            archive.finalize();
        });

        return {
            success: true,
            filepath: zipFilePath,
            filename: zipFileName,
            message: `Date-separated reports generated successfully for all departments.`,
            type: 'file'
        };
    } else if (isMasterReport && !isSeparateDate) {
        // Create one master report for all departments
        const reportResult = await createReportFile(
            'Master_Report',
            dateRangeStr,
            employeeType,
            optionsArray.join('_'),
            employeeDetails,
            finalAttendanceData,
            metricsData,
            dates,
            numericMonth,
            numericYear,
            null, // No specific department
            dateRangeDisplay,
            isMistakeDate,
            isSeparateDate,
            isNetOt
        );
        return reportResult;
    } else if (isSeparateDate) {
        // Create separate files for each department AND each date
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        const zipFileName = `Department_Date_Reports_${dateRangeStr}_${employeeType}_${optionsArray.join('_')}.zip`;
        const zipFilePath = path.join(reportsDir, zipFileName);
        const output = fs.createWriteStream(zipFilePath);

        archive.pipe(output);

        // Process each department and date combination
        for (const [department, employees] of Object.entries(departmentGroups)) {
            for (const date of dates) {
                const dateStr = dayjs(date).format('YYYY-MM-DD');
                const singleDateDisplay = dayjs(date).format('DD-MM-YYYY');

                const reportResult = await createReportFile(
                    `${department}_${singleDateDisplay}`,
                    dateStr,
                    employeeType,
                    optionsArray.join('_'),
                    employees,
                    finalAttendanceData,
                    metricsData,
                    [date], // Single date array
                    numericMonth,
                    numericYear,
                    department,
                    `(${singleDateDisplay})`, // Date display
                    isMistakeDate,
                    false, // Not separate date within this report
                    isNetOt
                );

                // Add the file to the zip
                if (reportResult && reportResult.filepath) {
                    archive.file(reportResult.filepath, { name: path.basename(reportResult.filepath) });
                }
            }
        }

        // Finalize the zip file
        await new Promise((resolve, reject) => {
            archive.on('error', reject);
            output.on('close', resolve);
            archive.finalize();
        });

        return {
            success: true,
            filepath: zipFilePath,
            filename: zipFileName,
            message: `Department and date-separated reports generated successfully.`,
            type: 'file'
        };
    } else {
        // Create separate reports for each department and combine into a zip
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        const zipFileName = `Department_Reports_${dateRangeStr}_${employeeType}_${optionsArray.join('_')}.zip`;
        const zipFilePath = path.join(reportsDir, zipFileName);
        const output = fs.createWriteStream(zipFilePath);

        archive.pipe(output);

        // Process each department
        for (const [department, employees] of Object.entries(departmentGroups)) {
            const reportResult = await createReportFile(
                department,
                dateRangeStr,
                employeeType,
                optionsArray.join('_'),
                employees,
                finalAttendanceData,
                metricsData,
                dates,
                numericMonth,
                numericYear,
                department, // Pass department name
                dateRangeDisplay,
                isMistakeDate,
                isSeparateDate,
                isNetOt
            );

            // Add the file to the zip
            if (reportResult && reportResult.filepath) {
                archive.file(reportResult.filepath, { name: path.basename(reportResult.filepath) });
            }
        }

        // Finalize the zip file
        await new Promise((resolve, reject) => {
            archive.on('error', reject);
            output.on('close', resolve);
            archive.finalize();
        });

        return {
            success: true,
            filepath: zipFilePath,
            filename: zipFileName,
            message: `Report generated successfully for employees.`,
            type: 'file' // Add this to indicate it's a file response};
        }

    };
}

/**
 * Creates a single report file
 */
async function createReportFile(reportType, dateRangeStr, employeeType, optionsStr, employees, finalAttendanceData, metricsData, dates, numericMonth, numericYear, department, dateRangeDisplay, isMistakeDate, isSeparateDate, isNetOt) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    // Apply filter based on employeeType
    let filteredEmployees = [...employees];

    if (employeeType === 'Faulty Employees') {
        // Get only employees with faulty data (diff > 0.25)
        const faultyEmployeeIds = new Set();

        dates.forEach(date => {
            const dateStr = dayjs(date).format('YYYY-MM-DD');

            employees.forEach(employee => {
                const empId = employee.dataValues.employee_id;
                const punchCode = employee.dataValues.punch_code;

                // Find attendance for this employee on this date
                const attendance = finalAttendanceData.find(a =>
                    a.employee_id === empId &&
                    a.attendance_date === dateStr
                );

                if (!attendance) return;

                // Find metrics for this employee
                const metric = metricsData.find(m =>
                    m.dataValues.punch_code === punchCode &&
                    m.dataValues.month_year === `${numericYear}-${String(numericMonth).padStart(2, '0')}`
                );

                if (!metric) return; // Skip if no metric found for this punch code

                // Parse metrics data
                const networkHoursData = JSON.parse(metric.dataValues.network_hours || '[]');
                const overtimeHoursData = JSON.parse(metric.dataValues.overtime_hours || '[]');

                // Get day of month for matching with metrics
                const dayOfMonth = dayjs(date).format('DD');

                // Find metrics for this specific day
                const dayNetworkHours = networkHoursData.find(d => d.date === dayOfMonth);
                const dayOvertimeHours = overtimeHoursData.find(d => d.date === dayOfMonth);

                // Calculate differences
                const networkHoursDiff = Math.abs(
                    (dayNetworkHours ? parseFloat(dayNetworkHours.hours) : 0) -
                    (attendance.network_hours || 0)
                );

                const overtimeHoursDiff = Math.abs(
                    (dayOvertimeHours ? parseFloat(dayOvertimeHours.hours) : 0) -
                    (attendance.overtime_hours || 0)
                );

                // If difference is more than 0.25, add to faulty employees
                if (networkHoursDiff > 0.25 || overtimeHoursDiff > 0.25) {
                    faultyEmployeeIds.add(empId);
                }
            });
        });

        filteredEmployees = employees.filter(emp =>
            faultyEmployeeIds.has(emp.dataValues.employee_id)
        );
    } else if (employeeType === 'New Employees') {
        // Get only employees with "new" punch code
        filteredEmployees = employees.filter(emp =>
            emp.dataValues.punch_code &&
            emp.dataValues.punch_code.toLowerCase() === 'new'
        );
    }

    // For mistake date option, use all employees unless they are specifically filtered above
    // This ensures all employees are considered for mistake date option

    // Create title based on whether this is a master report or department-specific report
    let title;
    if (department) {
        // Department-specific report
        title = `Master Report ${department} ${dateRangeDisplay}`;
    } else {
        // Master report with all departments
        title = `Master Report ${dateRangeDisplay}`;
    }

    // Determine number of columns per date based on options
    let columnsPerDate = isNetOt ? 2 : 7;

    // Header row - Title
    const titleRow = worksheet.addRow([title]);
    titleRow.font = { bold: true, size: 16 };

    // Calculate total number of columns for title merging
    const totalColumns = 6 + (dates.length * columnsPerDate) + (isNetOt ? 7 : 7); // Add 7 for totals

    worksheet.mergeCells(1, 1, 1, totalColumns); // Merge cells for title
    titleRow.alignment = { horizontal: 'center' };

    // Skip a row
    worksheet.addRow([]);

    // Header row - Employee details
    const detailsHeaderRow = worksheet.addRow([
        'Sr No', 'Punch Code', 'Name', 'Designation', 'Department', 'Reporting Group'
    ]);

    // Date headers
    let colIndex = 7; // Starting after employee details

    dates.forEach(date => {
        const dateStr = dayjs(date).format('DD-MM-YYYY');
        const dateHeaderCell = detailsHeaderRow.getCell(colIndex);
        dateHeaderCell.value = dateStr;

        // Merge date header across its columns (2 for net-ot, 7 for normal)
        worksheet.mergeCells(3, colIndex, 3, colIndex + columnsPerDate - 1);

        colIndex += columnsPerDate;
    });

    // Add "Total" header
    const totalHeaderCell = detailsHeaderRow.getCell(colIndex);
    totalHeaderCell.value = 'Total';

    // Keep all columns for totals regardless of the net-ot option
    worksheet.mergeCells(3, colIndex, 3, colIndex + 6);

    // Format headers
    detailsHeaderRow.font = { bold: true };
    detailsHeaderRow.alignment = { horizontal: 'center' };

    // Sub-headers for each date
    const subHeaderRow = worksheet.addRow([]);

    // Employee details placeholders
    for (let i = 0; i < 6; i++) {
        subHeaderRow.getCell(i + 1).value = '';
    }

    // Date sub-headers
    colIndex = 7;
    dates.forEach(() => {
        if (isNetOt) {
            // Only include Net Hr and Ot Hr for net-ot option
            subHeaderRow.getCell(colIndex++).value = 'Net Hr';
            subHeaderRow.getCell(colIndex++).value = 'Ot Hr';
        } else {
            // Include all columns for standard report
            subHeaderRow.getCell(colIndex++).value = 'Net Hr';
            subHeaderRow.getCell(colIndex++).value = 'Ot Hr';
            subHeaderRow.getCell(colIndex++).value = 'Matrix Net Hr';
            subHeaderRow.getCell(colIndex++).value = 'Matrix Ot Hr';
            subHeaderRow.getCell(colIndex++).value = 'Net Diff';
            subHeaderRow.getCell(colIndex++).value = 'Ot Diff';
            subHeaderRow.getCell(colIndex++).value = 'Comment';
        }
    });

    // Total sub-headers - always show all columns
    subHeaderRow.getCell(colIndex++).value = 'Net Hr';
    subHeaderRow.getCell(colIndex++).value = 'Ot Hr';
    subHeaderRow.getCell(colIndex++).value = 'Matrix Net Hr';
    subHeaderRow.getCell(colIndex++).value = 'Matrix Ot Hr';
    subHeaderRow.getCell(colIndex++).value = 'Net Diff';
    subHeaderRow.getCell(colIndex++).value = 'Ot Diff';
    subHeaderRow.getCell(colIndex++).value = '';

    // Format sub-headers
    subHeaderRow.font = { bold: true };
    subHeaderRow.alignment = { horizontal: 'center' };

    // Add employee data rows
    let srNo = 1;

    // Create arrays to store totals for each column
    const dailyTotals = {};

    // Initialize totals for each date and column
    dates.forEach(date => {
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        dailyTotals[dateStr] = {
            netHr: 0,
            otHr: 0,
            matrixNetHr: 0,
            matrixOtHr: 0,
            netDiff: 0,
            otDiff: 0
        };
    });

    // Initialize grand totals
    const grandTotals = {
        netHr: 0,
        otHr: 0,
        matrixNetHr: 0,
        matrixOtHr: 0,
        netDiff: 0,
        otDiff: 0
    };

    // Use all filtered employees
    const employeesToProcess = filteredEmployees;

    // Populate employee rows
    for (const employee of employeesToProcess) {
        const rowData = [];
        const empId = employee.dataValues.employee_id;
        const punchCode = employee.dataValues.punch_code;

        // Store data for each date, to be processed later
        const dateDataMap = {};

        // Track which dates have mistakes for this employee
        const mistakeDateMap = {};

        // Pre-process all dates to identify which ones have mistakes
        for (const date of dates) {
            const dateStr = dayjs(date).format('YYYY-MM-DD');
            const attendance = finalAttendanceData.find(a =>
                a.employee_id === empId &&
                a.attendance_date === dateStr
            );

            const metric = metricsData.find(m =>
                m.dataValues.punch_code === punchCode &&
                m.dataValues.month_year === `${numericYear}-${String(numericMonth).padStart(2, '0')}`
            );

            // Default values
            let netHr = 0;
            let otHr = 0;
            let matrixNetHr = 0;
            let matrixOtHr = 0;
            let netDiff = 0;
            let otDiff = 0;
            let comment = '';

            if (attendance) {
                netHr = attendance.network_hours || 0;
                otHr = attendance.overtime_hours || 0;
                comment = attendance.comment || '';
            }

            if (metric) {
                // Parse metrics data
                const networkHoursData = JSON.parse(metric.dataValues.network_hours || '[]');
                const overtimeHoursData = JSON.parse(metric.dataValues.overtime_hours || '[]');

                // Get day of month for matching with metrics
                const dayOfMonth = dayjs(date).format('DD');

                // Find metrics for this specific day
                const dayNetworkHours = networkHoursData.find(d => d.date === dayOfMonth);
                const dayOvertimeHours = overtimeHoursData.find(d => d.date === dayOfMonth);

                if (dayNetworkHours) {
                    matrixNetHr = parseFloat(dayNetworkHours.hours);
                }

                if (dayOvertimeHours) {
                    matrixOtHr = parseFloat(dayOvertimeHours.hours);
                }
            }

            // Calculate differences
            if (metric) {
                // Only calculate differences if metric exists for this punch code
                netDiff = matrixNetHr - netHr;
                otDiff = matrixOtHr - otHr;
            } else {
                // If no metric found for this punch code, set differences to 0
                netDiff = 0;
                otDiff = 0;
            }

            // Store all data for this date
            dateDataMap[dateStr] = {
                netHr,
                otHr,
                matrixNetHr,
                matrixOtHr,
                netDiff,
                otDiff,
                comment,
                hasMistake: (Math.abs(netDiff) > 0.25 || Math.abs(otDiff) > 0.25) && metric !== undefined
            };

            // Mark dates with mistakes
            if (dateDataMap[dateStr].hasMistake) {
                mistakeDateMap[dateStr] = true;
            }
        }

        // Skip employee if no dates have mistakes when using mistake date option
        if (isMistakeDate && Object.keys(mistakeDateMap).length === 0) {
            continue;
        }

        // Add employee details
        rowData.push(
            srNo++,
            punchCode,
            employee.dataValues.name,
            employee.dataValues.designation,
            employee.dataValues.department,
            employee.dataValues.reporting_group
        );

        // Employee totals
        const employeeTotals = {
            netHr: 0,
            otHr: 0,
            matrixNetHr: 0,
            matrixOtHr: 0,
            netDiff: 0,
            otDiff: 0
        };

        // For each date, add attendance data
        for (const date of dates) {
            const dateStr = dayjs(date).format('YYYY-MM-DD');

            // Skip dates without mistakes if using mistake date option
            if (isMistakeDate && !mistakeDateMap[dateStr]) {
                // Push empty cells for this date
                if (isNetOt) {
                    rowData.push('', '');
                } else {
                    rowData.push('', '', '', '', '', '', '');
                }
                continue;
            }

            const dateData = dateDataMap[dateStr];

            // Add to employee totals (only count dates we're displaying)
            employeeTotals.netHr += dateData.netHr;
            employeeTotals.otHr += dateData.otHr;
            employeeTotals.matrixNetHr += dateData.matrixNetHr;
            employeeTotals.matrixOtHr += dateData.matrixOtHr;
            employeeTotals.netDiff += dateData.netDiff;
            employeeTotals.otDiff += dateData.otDiff;

            // Add to daily totals (only count dates we're displaying)
            dailyTotals[dateStr].netHr += dateData.netHr;
            dailyTotals[dateStr].otHr += dateData.otHr;
            dailyTotals[dateStr].matrixNetHr += dateData.matrixNetHr;
            dailyTotals[dateStr].matrixOtHr += dateData.matrixOtHr;
            dailyTotals[dateStr].netDiff += dateData.netDiff;
            dailyTotals[dateStr].otDiff += dateData.otDiff;

            // Add data to row based on net-ot option
            if (isNetOt) {
                rowData.push(dateData.netHr, dateData.otHr);
            } else {
                rowData.push(
                    dateData.netHr,
                    dateData.otHr,
                    dateData.matrixNetHr,
                    dateData.matrixOtHr,
                    dateData.netDiff,
                    dateData.otDiff,
                    dateData.comment
                );
            }
        }

        // Add employee totals to row - always include all columns for totals
        rowData.push(
            employeeTotals.netHr,
            employeeTotals.otHr,
            employeeTotals.matrixNetHr,
            employeeTotals.matrixOtHr,
            employeeTotals.netDiff,
            employeeTotals.otDiff,
            ''
        );

        // Add to grand totals
        grandTotals.netHr += employeeTotals.netHr;
        grandTotals.otHr += employeeTotals.otHr;
        grandTotals.matrixNetHr += employeeTotals.matrixNetHr;
        grandTotals.matrixOtHr += employeeTotals.matrixOtHr;
        grandTotals.netDiff += employeeTotals.netDiff;
        grandTotals.otDiff += employeeTotals.otDiff;

        // Add row to worksheet
        const dataRow = worksheet.addRow(rowData);

        // Check for faulty data and highlight cells
        let cellIndex = 7; // Start after employee details

        for (const date of dates) {
            const dateStr = dayjs(date).format('YYYY-MM-DD');

            // Skip dates without mistakes if using mistake date option
            if (isMistakeDate && !mistakeDateMap[dateStr]) {
                cellIndex += columnsPerDate;
                continue;
            }

            if (!isNetOt) {
                // Only highlight cells in the full report mode
                const netDiffCell = dataRow.getCell(cellIndex + 4);
                const otDiffCell = dataRow.getCell(cellIndex + 5);

                // Highlight cells with difference > 0.25
                if (Math.abs(netDiffCell.value) > 0.25) {
                    netDiffCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFCCCC' } // Light red
                    };
                }

                if (Math.abs(otDiffCell.value) > 0.25) {
                    otDiffCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFCCCC' } // Light red
                    };
                }
            }

            cellIndex += columnsPerDate;
        }

        // Highlight totals cells if needed
        const totalNetDiffCell = dataRow.getCell(cellIndex + 4);
        const totalOtDiffCell = dataRow.getCell(cellIndex + 5);

        if (Math.abs(totalNetDiffCell.value) > 0.25) {
            totalNetDiffCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFCCCC' } // Light red
            };
        }

        if (Math.abs(totalOtDiffCell.value) > 0.25) {
            totalOtDiffCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFCCCC' } // Light red
            };
        }
    }

    // Add totals row
    const totalsRow = ['Totals', '', '', '', '', ''];

    // Add daily totals
    for (const date of dates) {
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        const dailyTotal = dailyTotals[dateStr];

        if (isNetOt) {
            totalsRow.push(
                dailyTotal.netHr,
                dailyTotal.otHr
            );
        } else {
            totalsRow.push(
                dailyTotal.netHr,
                dailyTotal.otHr,
                dailyTotal.matrixNetHr,
                dailyTotal.matrixOtHr,
                dailyTotal.netDiff,
                dailyTotal.otDiff,
                ''
            );
        }
    }

    // Add grand totals - always include all columns
    totalsRow.push(
        grandTotals.netHr,
        grandTotals.otHr,
        grandTotals.matrixNetHr,
        grandTotals.matrixOtHr,
        grandTotals.netDiff,
        grandTotals.otDiff,
        ''
    );

    const totalDataRow = worksheet.addRow(totalsRow);
    totalDataRow.font = { bold: true };
    worksheet.mergeCells(totalDataRow.number, 1, totalDataRow.number, 6);

    // Apply styling to the worksheet
    // Set column widths
    worksheet.columns.forEach((column, index) => {
        if (index < 6) {
            // Employee details columns
            column.width = 15;
        } else {
            // Date columns
            column.width = 12;
        }

        // Center alignment for all cells
        column.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Add borders to all cells
    worksheet.eachRow({ includeEmpty: true }, (row) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    // Add thick border around the table
    const lastRow = worksheet.rowCount;
    const lastCol = worksheet.columnCount;

    // Top border
    worksheet.getRow(3).eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
            ...cell.border,
            top: { style: 'medium' }
        };
    });

    // Bottom border
    worksheet.getRow(lastRow).eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
            ...cell.border,
            bottom: { style: 'medium' }
        };
    });

    // Left border
    for (let i = 3; i <= lastRow; i++) {
        const cell = worksheet.getCell(i, 1);
        cell.border = {
            ...cell.border,
            left: { style: 'medium' }
        };
    }

    // Right border
    for (let i = 3; i <= lastRow; i++) {
        const cell = worksheet.getCell(i, lastCol);
        cell.border = {
            ...cell.border,
            right: { style: 'medium' }
        };
    }

    // Create directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Create file name
    const fileName = `${reportType}_${dateRangeStr}_${employeeType}_${optionsStr}.xlsx`;
    const filePath = path.join(reportsDir, fileName);

    // Write the workbook to a file
    await workbook.xlsx.writeFile(filePath);

    return {
        success: true,
        filepath: filePath,
        filename: fileName,
        message: `Report generated successfully for employees.`,
        type: 'file' // Add this to indicate it's a file response
    };
}

module.exports = generateDetailedGroupReport;