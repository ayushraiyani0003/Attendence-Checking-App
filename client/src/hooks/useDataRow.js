import React, { useState, useEffect, useRef } from "react";
// At the top with your other imports
import {
    validateNetHR,
    validateOtHR,
    formatValue,
    canEdit,
    createPasswordModal,
} from "../utils/constants";

/**
 * Custom hook for DataRow component logic
 */
const useDataRow = ({
    row,
    rowIndex,
    hoveredRow,
    isAdmin,
    setHoveredRow,
    data,
    onCellUpdate,
    getFilteredData,
    attendanceData,
    isShowMetrixData,
    isShowDiffData,
    MetrixDiffData,
    attDateStart,
    attDateEnd,
    TotalDiffData,
    onRowNavigation,
    registerInputRef,
    handleVerticalKeyDown,
    sequentialIndex,
}) => {
    const [editableCell, setEditableCell] = useState(null);
    const [editValue, setEditValue] = useState({});
    const [netDiffValue, setNetDiffValue] = useState({});
    const [otDiffValue, setOtDiffValue] = useState({});
    const [showCommentPopup, setShowCommentPopup] = useState(false);

    const inputRef = useRef(null);
    const rowRef = useRef(null);

    // Filter attendance data based on attDateStart and attDateEnd
    const filteredAttendance = React.useMemo(() => {
        if (!row.attendance) return [];
        return row.attendance.filter((att) => {
            if (!att || !att.date) return false;
            // Parse attendance date (DD/MM/YYYY format)
            const [day, month, year] = att.date.split("/");
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
        if (!isShowDiffData || !isAdmin) return filteredAttendance;

        // Create a copy of filtered attendance to modify
        const displayData = filteredAttendance.map((att) => ({ ...att }));

        // Get metrix data for this employee
        const employeeMetrixData =
            MetrixDiffData?.filter(
                (item) => item.punchCode === row.punchCode
            ) || [];

        // Process each attendance record
        displayData.forEach((attendance) => {
            // Format the attendance date to match MetrixDiffData format
            if (attendance.date) {
                const [day, month, year] = attendance.date.split("/");
                const formattedDate = `${day}/${month}/${year}`;

                // If this employee's punch code exists in MetrixDiffData
                if (employeeMetrixData.length > 0) {
                    // Find matching metrix data for this date
                    const matchingMetrix = employeeMetrixData.find(
                        (metrix) => metrix.attendanceDate === formattedDate
                    );

                    // If matching metrix data exists for this date, use the diff values
                    if (matchingMetrix) {
                        attendance.netHR = matchingMetrix.netHRDiff || "0";
                        attendance.otHR = matchingMetrix.otHRDiff || "0";
                        // Add flags for threshold exceeding
                        attendance.netHRExceeds = exceedsThreshold(
                            matchingMetrix.netHRDiff
                        );
                        attendance.otHRExceeds = exceedsThreshold(
                            matchingMetrix.otHRDiff
                        );
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
    }, [
        filteredAttendance,
        isShowDiffData,
        isAdmin,
        row.punchCode,
        MetrixDiffData,
    ]);

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
                    let currentValue =
                        editValue[editKey] ||
                        displayData[colIndex]?.[currentField] ||
                        "0";
                    // Convert to string to ensure we can use string methods
                    currentValue = String(currentValue);
                    const originalValue = String(
                        displayData[colIndex]?.[currentField] || "0"
                    );

                    // Convert time format to decimal if needed (for final submission)
                    if (
                        (currentField === "netHR" || currentField === "otHR") &&
                        currentValue.includes(":")
                    ) {
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
                                currentValue = decimalHours
                                    .toFixed(2)
                                    .replace(/\.?0+$/, "");
                            }
                        } else {
                            // Invalid time format, revert to original
                            currentValue = originalValue;
                        }
                    }

                    // Only update if the value has actually changed
                    if (currentValue !== originalValue) {
                        // Format and update the value
                        const formattedValue = formatValue(
                            currentValue,
                            currentField
                        );
                        // Pass the date instead of colIndex
                        const attendanceDate = displayData[colIndex]?.date;
                        onCellUpdate(
                            rowIndex,
                            attendanceDate,
                            currentField,
                            formattedValue
                        );
                    }
                }

                // Clear the editable cell
                setEditableCell(null);
            }
        };

        // Add click listener
        document.addEventListener("mousedown", handleClickOutside);

        // Cleanup
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [editableCell, editValue, displayData, rowIndex, onCellUpdate]);

    // Handle edit action
    const handleEdit = (field, attendance, index) => {
        if (canEdit(attendance, isAdmin, isShowDiffData)) {
            if (isAdmin) {
                // Check if admin is already authenticated and authentication hasn't expired
                const adminAuthTime = sessionStorage.getItem("adminAuthTime");
                const currentTime = new Date().getTime();
                const oneHourInMillis = 30 * 60 * 1000;

                if (
                    adminAuthTime &&
                    currentTime - parseInt(adminAuthTime) < oneHourInMillis
                ) {
                    // Admin is already authenticated and within the 1-hour window
                    setEditableCell(`${field}-${index}`);
                    setEditValue((prev) => ({
                        ...prev,
                        [`${field}-${index}`]: attendance[field],
                    }));

                    // Set a timeout to clear authentication after the remaining time
                    const remainingTime =
                        oneHourInMillis -
                        (currentTime - parseInt(adminAuthTime));
                    if (!window.authTimeoutId) {
                        window.authTimeoutId = setTimeout(() => {
                            sessionStorage.removeItem("adminAuthTime");
                            window.authTimeoutId = null;
                        }, remainingTime);
                    }
                } else {
                    // Create a custom password modal
                    createPasswordModal((enteredPassword) => {
                        // This is the callback function that runs after password is entered
                        if (enteredPassword === "ptpl75750") {
                            // Password is correct, allow editing
                            // Store the authentication time
                            sessionStorage.setItem(
                                "adminAuthTime",
                                new Date().getTime().toString()
                            );

                            // Set a timeout to clear authentication after exactly 1 hour
                            if (window.authTimeoutId) {
                                clearTimeout(window.authTimeoutId);
                            }
                            window.authTimeoutId = setTimeout(() => {
                                sessionStorage.removeItem("adminAuthTime");
                                window.authTimeoutId = null;
                            }, oneHourInMillis);

                            setEditableCell(`${field}-${index}`);
                            // Initialize edit value with current cell value
                            setEditValue((prev) => ({
                                ...prev,
                                [`${field}-${index}`]: attendance[field],
                            }));
                        } else {
                            // Password is incorrect
                            alert("Incorrect password. Editing access denied.");
                        }
                    });
                }
            } else {
                // Non-admin users with edit permission can edit directly
                setEditableCell(`${field}-${index}`);
                // Initialize edit value with current cell value
                setEditValue((prev) => ({
                    ...prev,
                    [`${field}-${index}`]: attendance[field],
                }));
            }
        } else if (attendance && attendance.lock_status !== "unlocked") {
            alert("Editing is not allowed. This record is locked.");
        } else if (isAdmin && isShowDiffData) {
            alert("Editing is not allowed in metrix view mode.");
        }
    };

    // Handle comment action on double click
    const handleAddComment = (attendance, index) => {
        if (!attendance || !attendance.date) return;

        // Check if the record is locked first
        if (attendance && attendance.lock_status !== "unlocked") {
            alert("Editing is not allowed. This record is locked.");
            return;
        }

        const date = attendance.date;

        // Check if the current comment starts with "Site"
        const currentComment = attendance.comment || "";
        const isSiteComment = currentComment
            .trim()
            .toLowerCase()
            .startsWith("site");

        // Create a custom dialog
        const createCommentDialog = () => {
            // Create backdrop
            const backdrop = document.createElement("div");
            backdrop.className = "comment-dialog-backdrop";
            document.body.appendChild(backdrop);

            // Create dialog
            const dialog = document.createElement("div");
            dialog.className = "comment-dialog";

            dialog.innerHTML = `
        <h3 class="comment-dialog-header">Add Comment</h3>
        <div class="comment-dialog-info">
          <p><strong>Employee:</strong> ${row.name}</p>
          <p><strong>Punch Code:</strong> ${row.punchCode}</p>
          <p><strong>Date:</strong> ${date}</p>
        </div>
        <div class="comment-type-options">
          <div class="comment-type-option">
            <input type="radio" id="type-comment" name="commentType" value="comment" ${
                !isSiteComment ? "checked" : ""
            }>
            <label for="type-comment">Comment</label>
          </div>
          <div class="comment-type-option">
            <input type="radio" id="type-site" name="commentType" value="site" ${
                isSiteComment ? "checked" : ""
            }>
            <label for="type-site">Site</label>
          </div>
        </div>
        <textarea id="commentText" class="comment-textarea" placeholder="Enter your comment here...">${currentComment}</textarea>
        <div class="comment-dialog-actions">
          <button id="cancelBtn" class="comment-dialog-btn comment-dialog-btn-cancel">Cancel</button>
          <button id="saveBtn" class="comment-dialog-btn comment-dialog-btn-save">Save</button>
        </div>
      `;

            document.body.appendChild(dialog);

            return { dialog, backdrop };
        };

        const { dialog, backdrop } = createCommentDialog();

        // Get elements
        const commentTextarea = dialog.querySelector("#commentText");
        const commentTypeRadios = dialog.querySelectorAll(
            'input[name="commentType"]'
        );
        const saveBtn = dialog.querySelector("#saveBtn");
        const cancelBtn = dialog.querySelector("#cancelBtn");

        // Function to clean up the dialog
        const cleanupDialog = () => {
            document.body.removeChild(dialog);
            document.body.removeChild(backdrop);
        };

        // Function to update textarea based on selected type
        const updateTextarea = () => {
            const commentType = dialog.querySelector(
                'input[name="commentType"]:checked'
            ).value;
            let commentText = commentTextarea.value;

            if (commentType === "site") {
                // If switching to site and doesn't already start with "Site"
                if (!commentText.trim().toLowerCase().startsWith("site")) {
                    commentTextarea.value = "Site " + commentText;
                }
            } else {
                // If switching to regular comment and starts with "Site"
                if (commentText.trim().toLowerCase().startsWith("site")) {
                    commentTextarea.value = commentText.replace(
                        /^site\s*/i,
                        ""
                    );
                }
            }
        };

        // Set up event listeners
        commentTypeRadios.forEach((radio) => {
            radio.addEventListener("change", updateTextarea);
        });

        // Handle text input to enforce prefix for site comments
        commentTextarea.addEventListener("input", () => {
            const commentType = dialog.querySelector(
                'input[name="commentType"]:checked'
            ).value;
            if (commentType === "site") {
                const currentText = commentTextarea.value;
                if (!currentText.trim().toLowerCase().startsWith("site")) {
                    commentTextarea.value = "Site " + currentText;

                    // Move cursor position after the "Site " prefix
                    setTimeout(() => {
                        commentTextarea.selectionStart = 5;
                        commentTextarea.selectionEnd = 5;
                    }, 0);
                }
            }
        });

        // Handle save button
        saveBtn.addEventListener("click", () => {
            // Get the comment text
            let commentText = commentTextarea.value.trim();

            // Update comment via parent component's onCellUpdate function
            onCellUpdate(rowIndex, date, "comment", commentText);

            // Clean up
            cleanupDialog();
        });

        // Handle cancel button
        cancelBtn.addEventListener("click", () => {
            // Clean up
            cleanupDialog();
        });

        // Handle backdrop click to close dialog
        backdrop.addEventListener("click", () => {
            cleanupDialog();
        });

        // Handle ESC key to close dialog
        document.addEventListener("keydown", function escHandler(e) {
            if (e.key === "Escape") {
                cleanupDialog();
                document.removeEventListener("keydown", escHandler);
            }
        });

        // Initial update of textarea
        updateTextarea();

        // Focus the textarea
        commentTextarea.focus();
    };

    // Handle input change with improved validation
    // Handle input change with improved validation
    const handleChange = (e, column, index) => {
        let value = e.target.value;

        // Validate and format input based on field type
        if (column === "netHR" || column === "otHR") {
            // Check if user is typing a time format
            if (value.includes(":")) {
                // Allow typing time format without auto-conversion
                // Only validate once complete
                const completeTimeRegex = /^(\d+):([0-5]\d)$/;
                const partialTimeRegex = /^(\d+):([0-5])?$/;

                if (
                    !completeTimeRegex.test(value) &&
                    !partialTimeRegex.test(value)
                ) {
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
            if (value !== "" && !value.includes(":")) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    // Check if the attendance date being edited is a Wednesday
                    const attendanceRecord = displayData[index];
                    if (attendanceRecord && attendanceRecord.date) {
                        const [day, month, year] =
                            attendanceRecord.date.split("/");
                        const dateObj = new Date(year, month - 1, day);
                        const isWednesday = dateObj.getDay() === 3; // 0 is Sunday, 3 is Wednesday
                        console.log(isWednesday);

                        if (isWednesday) {
                            // For Wednesdays, allow up to 24 hours for both netHR and otHR
                            if (numValue > 24) {
                                value = "24";
                            }
                        } else {
                            // For other days, maintain existing limits
                            if (column === "netHR" && numValue > 11) {
                                value = "11";
                            } else if (column === "otHR" && numValue > 15) {
                                value = "15";
                            }
                        }
                    } else {
                        // If we can't determine the date, use the default limits
                        if (column === "netHR" && numValue > 11) {
                            value = "11";
                        } else if (column === "otHR" && numValue > 15) {
                            value = "15";
                        }
                    }
                }
            }
        } else if (column === "dnShift") {
            // Handle First/Third shift values - accept only 1S, 2S, 3S, GS and convert to uppercase
            value = String(value).toUpperCase().trim();
            console.log("Input value:", value);

            // Convert legacy shift codes to new format
            const shiftConversion = {
                D: "1S", // First Shift
                E: "2S", // Second Shift
                N: "3S", // Third Shift
                G: "GS", // General Shift
            };

            // Extract only the last typed character to determine the shift
            const lastChar = value.slice(-1);
            console.log("Last character:", lastChar);

            if (["1", "2", "3"].includes(lastChar)) {
                // User typed a number - convert to corresponding shift
                value = lastChar + "S";
            } else if (shiftConversion[lastChar]) {
                // User typed a legacy shift code - convert it
                value = shiftConversion[lastChar];
            } else if (["1S", "2S", "3S", "GS"].includes(value)) {
                // User typed complete valid shift code - keep as is
                value = value;
            } else {
                // Invalid input - default to GS
                value = "GS";
            }

            console.log("Final value:", value);
        }

        // Update edit value
        setEditValue((prev) => ({
            ...prev,
            [`${column}-${index}`]: value,
        }));
    };

    // Modified onKeyDown function with reliable update saving
    const onKeyDown = (e, column) => {
        try {
            // Handle vertical navigation with arrow keys
            if (e.key === "dowm ArrowUp" || e.key === "up ArrowDown") {
                e.preventDefault();

                // Parse column and index
                const [currentField, currentColIndex] = column.split("-");
                const colIndex = parseInt(currentColIndex);

                // Verify the column index is valid
                if (
                    !displayData ||
                    colIndex >= displayData.length ||
                    colIndex < 0
                ) {
                    console.error(
                        `Invalid column index ${colIndex} for row ${row.id}`
                    );
                    return;
                }

                // Get the date for this attendance record
                const attendanceDate = displayData[colIndex]?.date;
                if (!attendanceDate) {
                    console.error(
                        `No date found for index ${colIndex} in row ${row.id}`
                    );
                    return;
                }

                // Get current edit value
                const editKey = `${column}`;
                let currentValue =
                    editValue[editKey] ||
                    displayData[colIndex]?.[currentField] ||
                    "0";
                // Convert to string to ensure we can use string methods
                currentValue = String(currentValue);
                const originalValue = String(
                    displayData[colIndex]?.[currentField] || "0"
                );

                // Convert time format to decimal if needed (for final submission)
                if (
                    (currentField === "netHR" || currentField === "otHR") &&
                    currentValue.includes(":")
                ) {
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
                            currentValue = decimalHours
                                .toFixed(2)
                                .replace(/\.?0+$/, "");
                        }

                        // Update the editValue state with the converted value
                        setEditValue((prev) => ({
                            ...prev,
                            [editKey]: currentValue,
                        }));
                    } else {
                        // Invalid time format, revert to original
                        currentValue = originalValue;
                        setEditValue((prev) => ({
                            ...prev,
                            [editKey]: currentValue,
                        }));
                    }
                }

                // Validate values before saving
                let validationFailed = false;

                // Check if the date is a Wednesday
                const [day, month, year] = attendanceDate.split("/");
                const dateObj = new Date(year, month - 1, day);
                const isWednesday = dateObj.getDay() === 3; // 0 is Sunday, 3 is Wednesday

                if (currentField === "netHR") {
                    const numValue = parseFloat(currentValue);
                    if (isWednesday) {
                        // For Wednesdays, allow up to 24 hours
                        if (numValue > 24) {
                            alert("Net hours cannot exceed 24 on Wednesdays");
                            setEditValue((prev) => ({
                                ...prev,
                                [editKey]: "24",
                            }));
                            validationFailed = true;
                        }
                    } else if (!validateNetHR(currentValue)) {
                        // For non-Wednesdays, use standard validation
                        alert("Net hours cannot exceed 11");
                        setEditValue((prev) => ({ ...prev, [editKey]: "11" }));
                        validationFailed = true;
                    }
                }

                if (currentField === "otHR") {
                    const numValue = parseFloat(currentValue);
                    if (isWednesday) {
                        // For Wednesdays, allow up to 24 hours
                        if (numValue > 24) {
                            alert(
                                "Overtime hours cannot exceed 24 on Wednesdays"
                            );
                            setEditValue((prev) => ({
                                ...prev,
                                [editKey]: "24",
                            }));
                            validationFailed = true;
                        }
                    } else if (!validateOtHR(currentValue)) {
                        // For non-Wednesdays, use standard validation
                        alert("Overtime hours cannot exceed 15");
                        setEditValue((prev) => ({ ...prev, [editKey]: "15" }));
                        validationFailed = true;
                    }
                }

                if (validationFailed) return;

                // Only update if the value has changed
                if (currentValue !== originalValue) {
                    const formattedValue = formatValue(
                        currentValue,
                        currentField
                    );

                    // IMPORTANT: Use the rowIndex (index in the full attendanceData array)
                    // This matches what handleCellDataUpdate expects
                    onCellUpdate(
                        rowIndex,
                        attendanceDate,
                        currentField,
                        formattedValue
                    );
                }

                // Let the parent component handle vertical navigation
                if (typeof handleVerticalKeyDown === "function") {
                    handleVerticalKeyDown(e, sequentialIndex, row.id, column);
                } else {
                    console.error(
                        "handleVerticalKeyDown function not available"
                    );
                }
                return;
            }

            // Handle Enter, Tab and Shift+Tab
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();

                // Parse column and index
                const [currentField, currentColIndex] = column.split("-");
                const colIndex = parseInt(currentColIndex);

                // Get the date for this attendance record
                const attendanceDate = displayData[colIndex]?.date;
                if (!attendanceDate) {
                    console.error(
                        `No date found for index ${colIndex} in row ${row.id}`
                    );
                    return;
                }

                // Get current edit value
                const editKey = `${column}`;
                let currentValue =
                    editValue[editKey] ||
                    displayData[colIndex]?.[currentField] ||
                    "0";
                // Convert to string to ensure we can use string methods
                currentValue = String(currentValue);
                const originalValue = String(
                    displayData[colIndex]?.[currentField] || "0"
                );

                // Convert time format to decimal if needed (for final submission)
                if (
                    (currentField === "netHR" || currentField === "otHR") &&
                    currentValue.includes(":")
                ) {
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
                            currentValue = decimalHours
                                .toFixed(2)
                                .replace(/\.?0+$/, "");
                        }

                        // Update the editValue state with the converted value
                        setEditValue((prev) => ({
                            ...prev,
                            [editKey]: currentValue,
                        }));
                    } else {
                        // Invalid time format, revert to original
                        currentValue = originalValue;
                        setEditValue((prev) => ({
                            ...prev,
                            [editKey]: currentValue,
                        }));
                    }
                }

                // Validate values before saving
                let validationFailed = false;

                // Check if the date is a Wednesday
                const [day, month, year] = attendanceDate.split("/");
                const dateObj = new Date(year, month - 1, day);
                const isWednesday = dateObj.getDay() === 3; // 0 is Sunday, 3 is Wednesday

                if (currentField === "netHR") {
                    const numValue = parseFloat(currentValue);
                    if (isWednesday) {
                        // For Wednesdays, allow up to 24 hours
                        if (numValue > 24) {
                            alert("Net hours cannot exceed 24 on Wednesdays");
                            setEditValue((prev) => ({
                                ...prev,
                                [editKey]: "24",
                            }));
                            validationFailed = true;
                        }
                    } else if (!validateNetHR(currentValue)) {
                        // For non-Wednesdays, use standard validation
                        alert("Net hours cannot exceed 11");
                        setEditValue((prev) => ({ ...prev, [editKey]: "11" }));
                        validationFailed = true;
                    }
                }

                if (currentField === "otHR") {
                    const numValue = parseFloat(currentValue);
                    if (isWednesday) {
                        // For Wednesdays, allow up to 24 hours
                        if (numValue > 24) {
                            alert(
                                "Overtime hours cannot exceed 24 on Wednesdays"
                            );
                            setEditValue((prev) => ({
                                ...prev,
                                [editKey]: "24",
                            }));
                            validationFailed = true;
                        }
                    } else if (!validateOtHR(currentValue)) {
                        // For non-Wednesdays, use standard validation
                        alert("Overtime hours cannot exceed 15");
                        setEditValue((prev) => ({ ...prev, [editKey]: "15" }));
                        validationFailed = true;
                    }
                }

                if (validationFailed) return;

                // Only update if the value has changed
                if (currentValue !== originalValue) {
                    const formattedValue = formatValue(
                        currentValue,
                        currentField
                    );

                    // IMPORTANT: Use the rowIndex (index in the full attendanceData array)
                    // This matches what handleCellDataUpdate expects
                    onCellUpdate(
                        rowIndex,
                        attendanceDate,
                        currentField,
                        formattedValue
                    );
                }

                // Define the order of editable fields
                const fields = ["netHR", "otHR", "dnShift"];

                // Get the filtered data directly
                const filteredData = getFilteredData ? getFilteredData() : [];

                // Find the next cell to focus - USING SEQUENTIAL INDEX
                const findNextCell = () => {
                    // Check for Shift+Tab - move backward instead of forward
                    if (e.shiftKey && e.key === "Tab") {
                        const currentFieldIndex = fields.indexOf(currentField);

                        // Try previous field in the same column
                        if (currentFieldIndex > 0) {
                            return {
                                rowIndex: sequentialIndex,
                                column: `${
                                    fields[currentFieldIndex - 1]
                                }-${colIndex}`,
                            };
                        }

                        // Try last field in the previous column
                        if (colIndex > 0) {
                            return {
                                rowIndex: sequentialIndex,
                                column: `${fields[fields.length - 1]}-${
                                    colIndex - 1
                                }`,
                            };
                        }

                        // Try last field in the last column of the previous row
                        if (sequentialIndex > 0) {
                            // Move to the previous sequential index
                            const prevSequentialIndex = sequentialIndex - 1;

                            if (prevSequentialIndex >= 0) {
                                return {
                                    rowIndex: prevSequentialIndex,
                                    column: `${fields[fields.length - 1]}-${
                                        displayData.length - 1
                                    }`,
                                };
                            }
                        }

                        return null;
                    } else {
                        // Original forward navigation logic
                        const currentFieldIndex = fields.indexOf(currentField);

                        // Try next field in the same column
                        if (currentFieldIndex < fields.length - 1) {
                            return {
                                rowIndex: sequentialIndex, // Use sequentialIndex instead of rowIndex
                                column: `${
                                    fields[currentFieldIndex + 1]
                                }-${colIndex}`,
                            };
                        }

                        // Try first field in the next column
                        if (colIndex < displayData.length - 1) {
                            return {
                                rowIndex: sequentialIndex, // Use sequentialIndex instead of rowIndex
                                column: `${fields[0]}-${colIndex + 1}`,
                            };
                        }

                        // Try first field in the first column of the next row
                        if (sequentialIndex < filteredData.length - 1) {
                            // Move to the next sequential index
                            const nextSequentialIndex = sequentialIndex + 1;

                            if (nextSequentialIndex < filteredData.length) {
                                return {
                                    rowIndex: nextSequentialIndex, // Use nextSequentialIndex
                                    column: `${fields[0]}-0`,
                                };
                            }
                        }
                    }

                    return null;
                };

                const nextCell = findNextCell();

                if (nextCell) {
                    // If next cell is in the same row, just set the editable cell
                    if (nextCell.rowIndex === sequentialIndex) {
                        setEditableCell(nextCell.column);

                        // Focus the input after a brief delay
                        setTimeout(() => {
                            if (inputRef.current) {
                                inputRef.current.focus();
                                if (inputRef.current.select) {
                                    inputRef.current.select();
                                }
                            }
                        }, 10);
                    } else {
                        // If next cell is in a different row, first clear this cell's editable state
                        setEditableCell(null);

                        // Then fire a navigation event to the next/previous row
                        const navigationEvent = new CustomEvent(
                            "verticalNavigate",
                            {
                                detail: {
                                    rowIndex: nextCell.rowIndex,
                                    employeeId:
                                        filteredData[nextCell.rowIndex]?.id,
                                    cellKey: nextCell.column,
                                },
                                bubbles: true,
                            }
                        );
                        document.dispatchEvent(navigationEvent);
                    }
                } else {
                    setEditableCell(null);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                setEditableCell(null);
            }
        } catch (err) {
            console.error(
                "Error in onKeyDown:",
                err,
                "row:",
                row.id,
                "column:",
                column
            );
        }
    };

    // Updated event handlers for DataRow component
    useEffect(() => {
        // Handler for saving the current cell value
        const handleSaveEvent = (event) => {
            try {
                // Match by sequential index
                if (event.detail.rowIndex === sequentialIndex) {
                    if (!editableCell) return;

                    //   console.log(`Row ${sequentialIndex} (Employee ${row.id}) saving editable cell ${editableCell}`);

                    const [field, indexStr] = editableCell.split("-");
                    const colIndex = parseInt(indexStr);

                    // Safety check
                    if (displayData && displayData[colIndex]) {
                        // Get current edit value
                        const editKey = `${editableCell}`;
                        let currentValue =
                            editValue[editKey] ||
                            displayData[colIndex]?.[field] ||
                            "0";
                        currentValue = String(currentValue);

                        // Apply value formatting
                        let formattedValue = currentValue;
                        if (field === "dnShift") {
                            formattedValue = currentValue.toUpperCase();
                            if (
                                !["1S", "2S", "3S", "GS"].includes(
                                    formattedValue
                                )
                            ) {
                                formattedValue = "GS"; // Default
                            }
                        } else {
                            // For numeric fields
                            if (isNaN(parseFloat(currentValue))) {
                                formattedValue = "0";
                            } else {
                                formattedValue =
                                    parseFloat(currentValue).toString();
                            }
                        }

                        const attendanceDate = displayData[colIndex]?.date;
                        if (attendanceDate) {
                            // IMPORTANT: Use the actual array index that matches your update logic
                            // If your update function expects the index position in the data array, use rowIndex
                            // If your update function expects a sequential position in filtered data, use sequentialIndex
                            //   console.log(`💾 Saving ${field}=${formattedValue} for date ${attendanceDate} in row index ${sequentialIndex}`);

                            // Pass the row index from the filtered data (sequentialIndex)
                            // This is what your handleCellDataUpdate expects
                            onCellUpdate(
                                sequentialIndex,
                                attendanceDate,
                                field,
                                formattedValue
                            );
                        }
                    }
                }
            } catch (err) {
                console.error("Error handling save event:", err);
            }
        };

        // Handler for receiving navigation events
        const handleNavigationEvent = (event) => {
            try {
                // Match by sequential index
                if (event.detail.rowIndex === sequentialIndex) {
                    //   console.log(`Row ${sequentialIndex} (Employee ${row.id}) received navigation event for cell ${event.detail.cellKey}`);

                    // Set this cell as editable
                    setEditableCell(event.detail.cellKey);

                    // Ensure the input gets focus after a brief delay
                    setTimeout(() => {
                        try {
                            if (inputRef.current) {
                                inputRef.current.focus();
                                if (inputRef.current.select) {
                                    inputRef.current.select();
                                }
                            }
                        } catch (err) {
                            console.error("Error focusing input:", err);
                        }
                    }, 50);
                }
            } catch (err) {
                console.error("Error handling navigation event:", err);
            }
        };

        // Handler for clearing editable state
        const handleClearEvent = (event) => {
            try {
                // Match by sequential index
                if (event.detail.rowIndex === sequentialIndex) {
                    //   console.log(`Row ${sequentialIndex} (Employee ${row.id}) clearing editable state`);
                    setEditableCell(null);
                }
            } catch (err) {
                console.error("Error handling clear event:", err);
            }
        };

        // Add event listeners
        document.addEventListener("saveEditableCell", handleSaveEvent);
        document.addEventListener("verticalNavigate", handleNavigationEvent);
        document.addEventListener("clearEditableCell", handleClearEvent);

        // Clean up event listeners
        return () => {
            document.removeEventListener("saveEditableCell", handleSaveEvent);
            document.removeEventListener(
                "verticalNavigate",
                handleNavigationEvent
            );
            document.removeEventListener("clearEditableCell", handleClearEvent);
        };
    }, [
        sequentialIndex,
        row.id,
        editableCell,
        editValue,
        displayData,
        onCellUpdate,
    ]);

    // Function to check if row has any comments
    const hasAnyComments = () => {
        if (!row.attendance) return false;
        return row.attendance.some(
            (att) => att.comment && att.comment.trim() !== ""
        );
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

    // Calculate total differences from MetrixDiffData
    useEffect(() => {
        // Skip if no punch code
        if (!row.punchCode) {
            setNetDiffValue({});
            setOtDiffValue({});
            return;
        }

        // Process MetrixDiffData to sum up differences
        if (MetrixDiffData && MetrixDiffData.length > 0) {
            // Filter for this employee
            const employeeMetrixData = MetrixDiffData.filter(
                (item) => item.punchCode === row.punchCode
            );

            if (employeeMetrixData.length > 0) {
                // Initialize totals
                let totalNetHRDiff = 0;
                let totalOtHRDiff = 0;

                // Calculate total differences for this employee
                employeeMetrixData.forEach((metrixItem) => {
                    // For each date, add up the difference values
                    if (metrixItem.netHRDiff !== undefined) {
                        const netHRDiffValue = parseFloat(metrixItem.netHRDiff);
                        if (!isNaN(netHRDiffValue)) {
                            totalNetHRDiff += netHRDiffValue;
                        }
                    }

                    if (metrixItem.otHRDiff !== undefined) {
                        const otHRDiffValue = parseFloat(metrixItem.otHRDiff);
                        if (!isNaN(otHRDiffValue)) {
                            totalOtHRDiff += otHRDiffValue;
                        }
                    }
                });

                // Format to 2 decimal places
                const formattedNetHRDiff = totalNetHRDiff.toFixed(2);
                const formattedOtHRDiff = totalOtHRDiff.toFixed(2);

                // Update state with the totals
                setNetDiffValue({
                    [row.punchCode]: formattedNetHRDiff,
                    total: formattedNetHRDiff,
                });

                setOtDiffValue({
                    [row.punchCode]: formattedOtHRDiff,
                    total: formattedOtHRDiff,
                });
            } else {
                // No data for this employee, reset diff values
                setNetDiffValue({ [row.punchCode]: "0.00", total: "0.00" });
                setOtDiffValue({ [row.punchCode]: "0.00", total: "0.00" });
            }
        } else {
            // No metrix data at all, reset diff values
            setNetDiffValue({ [row.punchCode]: "0.00", total: "0.00" });
            setOtDiffValue({ [row.punchCode]: "0.00", total: "0.00" });
        }
    }, [row.punchCode, MetrixDiffData]);

    // Return state and handlers
    return {
        editableCell,
        editValue,
        netDiffValue,
        otDiffValue,
        showCommentPopup,
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
        setShowCommentPopup,
    };
};

// Helper function to determine if a difference value exceeds the threshold
const exceedsThreshold = (diffValue) => {
    if (!diffValue) return false;
    const numValue = parseFloat(diffValue);
    return !isNaN(numValue) && Math.abs(numValue) > 0.25;
};

export default useDataRow;
