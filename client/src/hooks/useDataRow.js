import React, { useState, useEffect, useRef } from "react";
// At the top with your other imports
import { validateNetHR, validateOtHR, formatValue, canEdit } from "../utils/constants";

/**
 * Custom hook for DataRow component logic
 */
const useDataRow = ({
    row, rowIndex, hoveredRow, isAdmin, setHoveredRow, data, onCellUpdate,
    getFilteredData, attendanceData, isShowMetrixData, MetrixDiffData, attDateStart, attDateEnd, TotalDiffData
}) => {
    const [editableCell, setEditableCell] = useState(null);
    const [editValue, setEditValue] = useState({});
    const [netDiffValue, setNetDiffValue] = useState({});
    const [otDiffValue, setOtDiffValue] = useState({});
    const [showCommentPopup, setShowCommentPopup] = useState(false);

    // Additional state for totals
    const [totalNetHR, setTotalNetHR] = useState(0);
    const [totalOtHR, setTotalOtHR] = useState(0);
    const [nightShiftCount, setNightShiftCount] = useState(0);
    const [eveningShiftCount, setEveningShiftCount] = useState(0);
    const [siteCommentCount, setSiteCommentCount] = useState(0);
    const [absentCount, setAbsentCount] = useState(0);

    const inputRef = useRef(null);
    const rowRef = useRef(null);

    // Filter attendance data based on attDateStart and attDateEnd
    const filteredAttendance = React.useMemo(() => {
        if (!row.attendance) return [];
        return row.attendance.filter(att => {
            if (!att || !att.date) return false;
            // Parse attendance date (DD/MM/YYYY format)
            const [day, month, year] = att.date.split('/');
            const attDate = new Date(year, month - 1, day);
            // Parse filter dates (ISO format)
            const startDate = new Date(attDateStart);
            const endDate = new Date(attDateEnd);
            // Add one day to endDate to include the end date in the range
            endDate.setDate(endDate.getDate() + 1);
            // Show only attendance records within the date range
            return attDate >= startDate && attDate < endDate;
        });
    }, [row.attendance, attDateStart, attDateEnd]);

    // Process data to display based on isShowMetrixData flag
    const displayData = React.useMemo(() => {
        // If not showing metrix data or user is not admin, return regular filtered attendance
        if (!isShowMetrixData || !isAdmin) return filteredAttendance;

        // Create a copy of filtered attendance to modify
        const displayData = filteredAttendance.map(att => ({ ...att }));

        // Get metrix data for this employee
        const employeeMetrixData = MetrixDiffData?.filter(
            item => item.punchCode === row.punchCode
        ) || [];

        // Process each attendance record
        displayData.forEach((attendance) => {
            // Format the attendance date to match MetrixDiffData format
            if (attendance.date) {
                const [day, month, year] = attendance.date.split('/');
                const formattedDate = `${day}/${month}/${year}`;

                // If this employee's punch code exists in MetrixDiffData
                if (employeeMetrixData.length > 0) {
                    // Find matching metrix data for this date
                    const matchingMetrix = employeeMetrixData.find(
                        metrix => metrix.attendanceDate === formattedDate
                    );

                    // If matching metrix data exists for this date, use the diff values
                    if (matchingMetrix) {
                        attendance.netHR = matchingMetrix.netHRDiff || "0";
                        attendance.otHR = matchingMetrix.otHRDiff || "0";
                        // Add flags for threshold exceeding
                        attendance.netHRExceeds = exceedsThreshold(matchingMetrix.netHRDiff);
                        attendance.otHRExceeds = exceedsThreshold(matchingMetrix.otHRDiff);
                    } else {
                        // Date not found in metrix data, set to "0"
                        attendance.netHR = "0";
                        attendance.otHR = "0";
                        attendance.netHRExceeds = false;
                        attendance.otHRExceeds = false;
                    }
                } else {
                    // Punch code not found in metrix data
                    attendance.netHR = "0";
                    attendance.otHR = "0";
                    attendance.netHRExceeds = false;
                    attendance.otHRExceeds = false;
                }
            }
        });

        return displayData;
    }, [filteredAttendance, isShowMetrixData, isAdmin, row.punchCode, MetrixDiffData]);

    // Calculate totals whenever filteredAttendance or displayData changes
    useEffect(() => {
        // Choose which data source to use based on the mode
        // IMPORTANT: Always use filteredAttendance (original data) for calculations
        // regardless of whether we're in metrix view mode or not
        const dataToProcess = filteredAttendance;

        if (!dataToProcess || dataToProcess.length === 0) {
            setTotalNetHR(0);
            setTotalOtHR(0);
            setNightShiftCount(0);
            setEveningShiftCount(0);
            setSiteCommentCount(0);
            setAbsentCount(0);
            return;
        }

        // Calculate total network hours and overtime hours
        let netHRSum = 0;
        let otHRSum = 0;
        let nightCount = 0;
        let eveningCount = 0;
        let siteCount = 0;
        let absenceCount = 0;

        dataToProcess.forEach(att => {
            // Sum up network hours
            if (att.netHR) {
                const netHRValue = parseFloat(att.netHR);
                if (!isNaN(netHRValue)) {
                    netHRSum += netHRValue;

                    // Count absences (days with 0 network hours)
                    if (netHRValue === 0) {
                        absenceCount++;
                    }
                }
            } else {
                // If netHR is undefined or null, count as absence
                absenceCount++;
            }

            // Sum up overtime hours
            if (att.otHR) {
                const otHRValue = parseFloat(att.otHR);
                if (!isNaN(otHRValue)) {
                    otHRSum += otHRValue;
                }
            }

            // Count night shifts
            if (att.dnShift && att.dnShift.toUpperCase() === 'N') {
                nightCount++;
            }

            // Count evening shifts
            if (att.dnShift && att.dnShift.toUpperCase() === 'E') {
                eveningCount++;
            }

            // Count site comments
            if (att.comment &&
                att.comment.trim().toLowerCase().startsWith('site')) {
                siteCount++;
            }
        });

        // Update state with calculated totals
        setTotalNetHR(netHRSum);
        setTotalOtHR(otHRSum);
        setNightShiftCount(nightCount);
        setEveningShiftCount(eveningCount);
        setSiteCommentCount(siteCount);
        setAbsentCount(absenceCount);

    }, [filteredAttendance, isShowMetrixData]); // Only depend on filteredAttendance, not displayData

    // Handle clicks outside the input
    useEffect(() => {
        if (!editableCell) return;

        const handleClickOutside = (event) => {
            if (inputRef.current && !inputRef.current.contains(event.target)) {
                // Parse column and index
                const [currentField, currentColIndex] = editableCell.split("-");
                const colIndex = parseInt(currentColIndex);

                // Get current edit value for this cell
                const editKey = `${editableCell}`;

                // Check if the index is valid in the displayData array
                if (colIndex >= 0 && colIndex < displayData.length) {
                    // Get the current value and original value
                    let currentValue = editValue[editKey] || displayData[colIndex]?.[currentField] || "0";
                    // Convert to string to ensure we can use string methods
                    currentValue = String(currentValue);
                    const originalValue = String(displayData[colIndex]?.[currentField] || "0");

                    // Convert time format to decimal if needed (for final submission)
                    if ((currentField === "netHR" || currentField === "otHR") && currentValue.includes(':')) {
                        const timeFormatRegex = /^(\d+):([0-5]\d)$/;
                        const timeMatch = currentValue.match(timeFormatRegex);

                        if (timeMatch) {
                            const hours = parseInt(timeMatch[1], 10);
                            const minutes = parseInt(timeMatch[2], 10);
                            // Convert minutes to decimal (e.g., 30 minutes = 0.5 hours)
                            const minuteDecimal = minutes / 60;
                            const decimalHours = hours + minuteDecimal;

                            // Use exact decimal representation without rounding
                            if (minutes === 0) {
                                currentValue = hours.toString();
                            } else if (minutes === 30) {
                                currentValue = (hours + 0.5).toString();
                            } else {
                                // For other minute values, use up to 2 decimal places if needed
                                currentValue = decimalHours.toFixed(2).replace(/\.?0+$/, '');
                            }
                        } else {
                            // Invalid time format, revert to original
                            currentValue = originalValue;
                        }
                    }

                    // Only update if the value has actually changed
                    if (currentValue !== originalValue) {
                        // Format and update the value
                        const formattedValue = formatValue(currentValue, currentField);
                        // Pass the date instead of colIndex
                        const attendanceDate = displayData[colIndex]?.date;
                        onCellUpdate(rowIndex, attendanceDate, currentField, formattedValue);
                    }
                }

                // Clear the editable cell
                setEditableCell(null);
            }
        };

        // Add click listener
        document.addEventListener('mousedown', handleClickOutside);

        // Cleanup
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [editableCell, editValue, displayData, rowIndex, onCellUpdate]);

    // Handle edit action
    const handleEdit = (field, attendance, index) => {
        if (canEdit(attendance, isAdmin, isShowMetrixData)) {
            setEditableCell(`${field}-${index}`);
            // Initialize edit value with current cell value
            setEditValue(prev => ({
                ...prev,
                [`${field}-${index}`]: attendance[field]
            }));
        } else if (attendance && attendance.lock_status !== "unlocked") {
            alert("Editing is not allowed. This record is locked.");
        } else if (isAdmin && isShowMetrixData) {
            alert("Editing is not allowed in metrix view mode.");
        }
    };

    // Handle comment action on double click
    const handleAddComment = (attendance, index) => {
        if (!attendance || !attendance.date) return;

        // Check if the record is locked first
        if (attendance && attendance.lock_status !== "unlocked") {
            alert("add comment is not allowed. This record is locked.");
            return;
        }

        const date = attendance.date;

        // Create a detailed prompt message
        const promptMessage = `Add comment for: ${date}\nEmployee: ${row.name}\nPunch Code: ${row.punchCode}\n\nCurrent comment: ${attendance.comment || "None"}\nEnter new comment:`;

        // Show prompt to add/edit comment
        const commentText = window.prompt(promptMessage, attendance.comment || "");

        // If user cancels, return without updating
        if (commentText === null) return;

        // Update comment via parent component's onCellUpdate function
        onCellUpdate(rowIndex, date, "comment", commentText.trim());

    };

    // Handle input change with improved validation
    const handleChange = (e, column, index) => {
        let value = e.target.value;

        // Validate and format input based on field type
        if (column === "netHR" || column === "otHR") {
            // Check if user is typing a time format
            if (value.includes(':')) {
                // Allow typing time format without auto-conversion
                // Only validate once complete
                const completeTimeRegex = /^(\d+):([0-5]\d)$/;
                const partialTimeRegex = /^(\d+):([0-5])?$/;

                if (!completeTimeRegex.test(value) && !partialTimeRegex.test(value)) {
                    // Invalid time format, allow only valid characters
                    value = value.replace(/[^0-9:]/g, "");
                }
            } else {
                // For decimal format, allow only numbers and one decimal point
                value = value.replace(/[^0-9.]/g, "");

                // Ensure only one decimal point
                const decimalCount = (value.match(/\./g) || []).length;
                if (decimalCount > 1) {
                    value = value.substring(0, value.lastIndexOf("."));
                }
            }

            // Apply maximum value constraints only for fully entered values
            if (value !== "" && !value.includes(':')) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    if (column === "netHR" && numValue > 11) {
                        value = "11";
                    } else if (column === "otHR" && numValue > 15) {
                        value = "15";
                    }
                }
            }
        } else if (column === "dnShift") {
            // Handle day/night shift values - accept only E, D, N and convert to uppercase
            value = value.toUpperCase();
            if (value.length > 0) {
                const lastChar = value.charAt(value.length - 1);
                if (['E', 'D', 'N'].includes(lastChar)) {
                    value = lastChar;
                } else {
                    value = 'D'; // Default to D if invalid input
                }
            }
        }

        // Update edit value
        setEditValue(prev => ({
            ...prev,
            [`${column}-${index}`]: value
        }));
    };

    // Improved keyboard navigation handling
    const onKeyDown = (e, column) => {
        if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();

            // Parse column and index
            const [currentField, currentColIndex] = column.split("-");
            const colIndex = parseInt(currentColIndex);

            // Get current edit value
            const editKey = `${column}`;
            let currentValue = editValue[editKey] || displayData[colIndex]?.[currentField] || "0";
            // Convert to string to ensure we can use string methods
            currentValue = String(currentValue);
            const originalValue = String(displayData[colIndex]?.[currentField] || "0");

            // Convert time format to decimal if needed (for final submission)
            if ((currentField === "netHR" || currentField === "otHR") && currentValue.includes(':')) {
                const timeFormatRegex = /^(\d+):([0-5]\d)$/;
                const timeMatch = currentValue.match(timeFormatRegex);

                if (timeMatch) {
                    const hours = parseInt(timeMatch[1], 10);
                    const minutes = parseInt(timeMatch[2], 10);
                    // Convert minutes to decimal (e.g., 30 minutes = 0.5 hours)
                    const minuteDecimal = minutes / 60;
                    const decimalHours = hours + minuteDecimal;

                    // Use exact decimal representation without rounding
                    if (minutes === 0) {
                        currentValue = hours.toString();
                    } else if (minutes === 30) {
                        currentValue = (hours + 0.5).toString();
                    } else {
                        // For other minute values, use up to 2 decimal places if needed
                        currentValue = decimalHours.toFixed(2).replace(/\.?0+$/, '');
                    }

                    // Update the editValue state with the converted value
                    setEditValue(prev => ({ ...prev, [editKey]: currentValue }));
                } else {
                    // Invalid time format, revert to original
                    currentValue = originalValue;
                    setEditValue(prev => ({ ...prev, [editKey]: currentValue }));
                }
            }

            // Validate values before saving
            let validationFailed = false;

            if (currentField === "netHR" && !validateNetHR(currentValue)) {
                alert("Net hours cannot exceed 11");
                setEditValue(prev => ({ ...prev, [editKey]: "11" }));
                validationFailed = true;
            }

            if (currentField === "otHR" && !validateOtHR(currentValue)) {
                alert("Overtime hours cannot exceed 15");
                setEditValue(prev => ({ ...prev, [editKey]: "15" }));
                validationFailed = true;
            }

            if (validationFailed) return;

            // Only update if the value has changed
            if (currentValue !== originalValue) {
                const formattedValue = formatValue(currentValue, currentField);
                // Pass the date instead of colIndex
                const attendanceDate = displayData[colIndex]?.date;
                onCellUpdate(rowIndex, attendanceDate, currentField, formattedValue);
            }

            // Define the order of editable fields
            const fields = ["netHR", "otHR", "dnShift"];

            // Get the full and filtered data sources
            const fullData = attendanceData || data;
            const filteredData = getFilteredData ? getFilteredData() : fullData;

            // Find the next cell to focus
            const findNextCell = () => {
                const currentFieldIndex = fields.indexOf(currentField);

                // Try next field in the same column
                if (currentFieldIndex < fields.length - 1) {
                    return {
                        rowIndex,
                        column: `${fields[currentFieldIndex + 1]}-${colIndex}`
                    };
                }

                // Try first field in the next column
                if (colIndex < displayData.length - 1) {
                    return {
                        rowIndex,
                        column: `${fields[0]}-${colIndex + 1}`
                    };
                }

                // Try first field in the first column of the next row
                if (rowIndex < filteredData.length - 1) {
                    const nextRowId = filteredData[rowIndex + 1].id;
                    const nextRowIndex = fullData.findIndex(item => item.id === nextRowId);

                    if (nextRowIndex >= 0) {
                        return {
                            rowIndex: nextRowIndex,
                            column: `${fields[0]}-0`
                        };
                    }
                }

                return null;
            };

            const nextCell = findNextCell();

            if (nextCell) {
                // Move to next cell - we'll just set the editableCell here
                // and let the parent component handle focusing the right row
                setEditableCell(nextCell.column);
            } else {
                setEditableCell(null);
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            setEditableCell(null);
        }
    };

    // Function to check if row has any comments
    const hasAnyComments = () => {
        if (!row.attendance) return false;
        return row.attendance.some(att => att.comment && att.comment.trim() !== "");
    };

    // Handle closing the comment popup
    const handleCloseCommentPopup = () => {
        setShowCommentPopup(false);
    };

    // Handle showing comment popup
    const handleShowCommentPopup = () => {
        if (hasAnyComments()) {
            setShowCommentPopup(true);
        }
    };

    // Process the difference data when it changes
    useEffect(() => {
        if (TotalDiffData) {
            // Initialize empty objects
            const netDiffs = {};
            const otDiffs = {};

            // Process each punch code in the totalDiffData
            Object.keys(TotalDiffData).forEach(punchCode => {
                netDiffs[punchCode] = TotalDiffData[punchCode].netHRDiff;
                otDiffs[punchCode] = TotalDiffData[punchCode].otHRDiff;
            });

            // Update state with the processed data
            setNetDiffValue(netDiffs);
            setOtDiffValue(otDiffs);
        }
    }, [TotalDiffData]);

    // Return state and handlers
    return {
        editableCell,
        editValue,
        netDiffValue,
        otDiffValue,
        showCommentPopup,
        totalNetHR,
        totalOtHR,
        nightShiftCount,
        eveningShiftCount,
        siteCommentCount,
        absentCount,
        inputRef,
        rowRef,
        filteredAttendance,
        displayData,
        setEditableCell,
        handleEdit,
        handleAddComment,
        handleChange,
        onKeyDown,
        hasAnyComments,
        handleCloseCommentPopup,
        handleShowCommentPopup,
        setShowCommentPopup
    };
};

// Helper function to determine if a difference value exceeds the threshold
const exceedsThreshold = (diffValue) => {
    if (!diffValue) return false;
    const numValue = parseFloat(diffValue);
    return !isNaN(numValue) && Math.abs(numValue) >= 0.5;
};

export default useDataRow;