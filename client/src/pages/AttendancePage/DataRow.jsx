import React, { useState, useEffect, useRef } from "react";

function DataRow({
  row,
  rowIndex,
  punchCode,
  hoveredRow,
  setHoveredRow,
  data,
  setData,
  onCellUpdate,
  user,
  lockStatusData,
  className,
  getFilteredData,
  attendanceData,
  displayWeeks,
  isShowMetrixData,
  MetrixDiffData,
  attDateStart, 
  attDateEnd
}) {
  console.log(row);
  
  const [editableCell, setEditableCell] = useState(null);
  const [editValue, setEditValue] = useState({});
  const inputRef = useRef(null);

  // Check if user is an admin
  const isAdmin = user.role === "admin";

  // Filter attendance data based on attDateStart and attDateEnd
// Filter attendance data based on attDateStart and attDateEnd
const filteredAttendance = row.attendance.filter(att => {
  // Parse attendance date (DD/MM/YYYY format)
  const [day, month, year] = att.date.split('/');
  const attDate = new Date(year, month - 1, day);
  
  // Parse filter dates (ISO format)
  const startDate = new Date(attDateStart);
  const endDate = new Date(attDateEnd);
  
  // Show only attendance records within the date range
  return attDate >= startDate && attDate <= endDate;
});

  const exceedsThreshold = (value) => {
    if (!value) return false;
    const numericValue = parseFloat(value);
    return !isNaN(numericValue) && Math.abs(numericValue) > 0.25; // 0.25 hours = 15 minutes
  };  

  // Add these validation functions at the top of your component
const validateNetHR = (value) => {
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue <= 11;
};

const validateOtHR = (value) => {
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue <= 15;
};

  // Prepare data to display based on isShowMetrixData flag and user role
  const getDisplayData = () => {
    // If not showing metrix data or user is not admin, return regular filtered attendance
    if (!isShowMetrixData || !isAdmin) return filteredAttendance;

    // Create a copy of filtered attendance to modify
    const displayData = filteredAttendance.map(att => ({ ...att }));

    // Check if MetrixDiffData exists and has records for this specific punch code
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
            // Keep dnShift unchanged as requested
          } else {
            // Date not found in metrix data, set to "0"
            attendance.netHR = "0";
            attendance.otHR = "0";
            attendance.netHRExceeds = false;
            attendance.otHRExceeds = false;
          }
        } else {
          // Punch code not found in metrix data, set to "0"
          attendance.netHR = "0";
          attendance.otHR = "0";
          attendance.netHRExceeds = false;
          attendance.otHRExceeds = false;
        }
      } else {
        // No date information, set to "0"
        attendance.netHR = "0";
        attendance.otHR = "0";
        attendance.netHRExceeds = false;
        attendance.otHRExceeds = false;
      }
    });

    return displayData;
  };

  // Get the appropriate data to display
  const displayData = getDisplayData();

  // Add effect to handle clicks outside the input
  useEffect(() => {
    // Only add listener if an input is currently active
    if (editableCell) {
      const handleClickOutside = (event) => {
        // Check if the click is outside the input
        if (inputRef.current && !inputRef.current.contains(event.target)) {
          // Parse column and index
          const [currentField, currentColIndex] = editableCell.split("-");
          const colIndex = parseInt(currentColIndex);

          // Get current edit value for this cell
          const editKey = `${editableCell}`;

          // Get the current value based on whether we're in metrix mode or not
          let currentValue;
          if (isShowMetrixData && isAdmin) {
            currentValue = editValue[editKey] || displayData[colIndex]?.[currentField] || "0";
          } else {
            currentValue = editValue[editKey] || row.attendance[colIndex][currentField];
          }

          // Get the original value to compare against
          let originalValue;
          if (isShowMetrixData && isAdmin) {
            originalValue = displayData[colIndex]?.[currentField] || "0";
          } else {
            originalValue = row.attendance[colIndex][currentField];
          }

          // Only update if the value has actually changed
          const hasValueChanged = currentValue !== originalValue;

          if (hasValueChanged) {
            // Format and update the value via WebSocket
            const formattedValue = formatValue(currentValue, currentField);
            onCellUpdate(rowIndex, colIndex, currentField, formattedValue);
          }

          // Clear the editable cell
          setEditableCell(null);
        }
      };

      // Add click listener to document
      document.addEventListener('mousedown', handleClickOutside);

      // Cleanup listener
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [editableCell, editValue, row, rowIndex, onCellUpdate, isShowMetrixData, displayData, isAdmin]);

  // Determine if the user can edit based on lock status and user role
  const canEdit = (attendance) => {
    // Check if the record is unlocked
    const isUnlocked = attendance.lock_status === "unlocked";
    
    // Admin can edit anything that's unlocked
    if (isAdmin) {
      return isUnlocked && !isShowMetrixData;
    }
    
    // Non-admin users can edit if the record is unlocked
    return isUnlocked;
  };

  // Handle edit action
  const handleEdit = (field, attendance, index) => {
    if (canEdit(attendance)) {
      setEditableCell(`${field}-${index}`);
      // Initialize edit value with current cell value
      setEditValue(prev => ({
        ...prev,
        [`${field}-${index}`]: attendance[field]
      }));
    } else {
      // Check if the record is locked or in metrix mode for admins
      if (attendance.lock_status !== "unlocked") {
        alert("Editing is not allowed. This record is locked.");
      } else if (isAdmin && isShowMetrixData) {
        alert("Editing is not allowed in metrix view mode.");
      }
    }
  };

  // Handle input change
  const handleChange = (e, rowIndex, column, index) => {
    let value = e.target.value;
  
    // Sanitize numeric input for netHR and otHR
    if (column === "netHR" || column === "otHR") {
      value = value.replace(/[^0-9.]/g, "");
      const decimalCount = (value.match(/\./g) || []).length;
      if (decimalCount > 1) {
        value = value.substring(0, value.lastIndexOf("."));
      }
      
      // Check for maximum values
      if (value !== "") {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          if (column === "netHR" && numValue > 11) {
            alert("Net hours cannot exceed 11");
            value = "11";
          } else if (column === "otHR" && numValue > 15) {
            alert("Overtime hours cannot exceed 15");
            value = "15";
          }
        }
      }
    }
    // Update edit value
    setEditValue(prev => ({
      ...prev,
      [`${column}-${index}`]: value
    }));
  };
  // Format value for update
  const formatValue = (value, column) => {
    if ((column === "netHR" || column === "otHR")) {
      // Parsing logic to handle different input scenarios
      const parsedFloat = parseFloat(value);

      // If input is a valid number
      if (!isNaN(parsedFloat)) {
        // Return integer as requested (no decimals)
        return Math.round(parsedFloat);
      }
      return 0; // Default to 0 for invalid input
    }
    return value;
  };

  // Key down handler with intelligent update
  const onKeyDown = (e, rowIndex, column, currentCellInfo) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
  
      // Parse column and index
      const [currentField, currentColIndex] = column.split("-");
      const colIndex = parseInt(currentColIndex);
  
      // Get current edit value for this cell
      const editKey = `${column}`;
      const currentValue = editValue[editKey] || currentCellInfo.originalValue;

      // Validate values before saving
    if (currentField === "netHR" && !validateNetHR(currentValue)) {
      alert("Net hours cannot exceed 11");
      setEditValue(prev => ({
        ...prev,
        [editKey]: "11"
      }));
      return;
    }
    
    if (currentField === "otHR" && !validateOtHR(currentValue)) {
      alert("Overtime hours cannot exceed 15");
      setEditValue(prev => ({
        ...prev,
        [editKey]: "15"
      }));
      return;
    }

    // Only update if the value has actually changed
    const hasValueChanged = currentValue !== currentCellInfo.originalValue;

    if (hasValueChanged) {
      // Format and update the value via WebSocket
      const formattedValue = formatValue(currentValue, currentField);
      onCellUpdate(rowIndex, colIndex, currentField, formattedValue);
    }
    
      // Define the order of fields
      const fields = ["netHR", "otHR", "dnShift"];

      // Determine the full data source
      const fullData = attendanceData || data;
      const filteredData = getFilteredData ? getFilteredData() : data;

      // Function to find the next cell to focus
      const findNextCell = (currentRowIndex, currentField, currentColIndex) => {
        const currentFieldIndex = fields.indexOf(currentField);

        // Try to move to the next field in the same column
        if (currentFieldIndex < fields.length - 1) {
          return {
            rowIndex: currentRowIndex,
            column: `${fields[currentFieldIndex + 1]}-${currentColIndex}`
          };
        }

        // If at the last field, try to move to the next column
        if (currentColIndex < (isShowMetrixData && isAdmin ? displayData.length - 1 : fullData[currentRowIndex].attendance.length - 1)) {
          return {
            rowIndex: currentRowIndex,
            column: `${fields[0]}-${currentColIndex + 1}`
          };
        }

        // If at the last column, try to move to the next row
        if (rowIndex < filteredData.length - 1) {
          const nextRowId = filteredData[rowIndex + 1].id;
          const nextRowOriginalIndex = fullData.findIndex(
            (item) => item.id === nextRowId
          );
          return {
            rowIndex: nextRowOriginalIndex,
            column: `${fields[0]}-0`
          };
        }

        // If no more cells, return null
        return null;
      };

      // Find the next cell to focus
      const nextCell = findNextCell(rowIndex, currentField, colIndex);

      if (nextCell) {
        // Update the editable cell to the next cell
        setEditableCell(`${nextCell.column}`);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Parse column and index
      const [currentField, currentColIndex] = column.split("-");
      const colIndex = parseInt(currentColIndex);

      // Get current edit value for this cell
      const editKey = `${column}`;
      const currentValue = editValue[editKey] || currentCellInfo.originalValue;

      // Only update if the value has actually changed
      const hasValueChanged = currentValue !== currentCellInfo.originalValue;

      if (hasValueChanged) {
        // Format and update the value via WebSocket
        const formattedValue = formatValue(currentValue, currentField);
        onCellUpdate(rowIndex, colIndex, currentField, formattedValue);
      }

      setEditableCell(null); // Save and exit editing
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditableCell(null); // Cancel editing
    }
  };

  // Define the getShiftClass function to handle different shifts (Day/Night)
  const getShiftClass = (shift) => {
    if (shift === "D") return "dnShift-Day";
    if (shift === "N") return "dnShift-Night";
    if (shift === "A") return "dnShift-AfterNoon";
    return "";
  };

  // Determine whether to show metrix display based on user role and isShowMetrixData
  const shouldShowMetrixDisplay = isAdmin && isShowMetrixData;

  return (
    <div
      className={`data-row ${hoveredRow === rowIndex ? "hovered" : ""}`}
      onMouseEnter={() => setHoveredRow(rowIndex)}
      onMouseLeave={() => setHoveredRow(null)}
    >
      <div className="fixed-data-cells">
        <div className="data-cell punch-code">{row.punchCode}</div>
        <div className="data-cell name">{row.name}</div>
        <div className="data-cell designation">{row.designation}</div>
        <div className="data-cell department">{row.department}</div>
      </div>

      <div className="scrollable-data-cells" id="body-scrollable">
        {displayData.map((attendance, displayIndex) => {
          // Calculate the original index in the full attendance array
          const originalIndex = displayWeeks === 0
            ? displayIndex
            : (displayWeeks - 1) * 7 + displayIndex;

          return (
            <div key={displayIndex} className="date-cell">
              {["netHR", "otHR", "dnShift"].map((field) => {
                const editKey = `${field}-${originalIndex}`;
                const isEditing = editableCell === editKey;
                const canEditThisCell = canEdit(attendance);

                // Use the value from the appropriate data source
                let cellValue = attendance[field] || (field === "dnShift" ? "" : "0");
                
                // Convert dnShift values to uppercase for consistency
                if (field === "dnShift" && cellValue) {
                  cellValue = cellValue.toUpperCase();
                }

                const displayValue = isEditing
                  ? (editValue[editKey] ?? cellValue)
                  : cellValue;

                let className = "sub-date-cell";
                if (field === "dnShift") {
                  className += ` ${getShiftClass(cellValue)}`;
                }
                if (isEditing) {
                  className += " editable";
                }

                // Only add exceeds-threshold class if admin and in metrix mode
                className += field === "netHR" && shouldShowMetrixDisplay && attendance.netHRExceeds ? " exceeds-threshold" : "";
                className += field === "otHR" && shouldShowMetrixDisplay && attendance.otHRExceeds ? " exceeds-threshold" : "";

                return (
                  <div
                    key={field}
                    className={className}
                    onClick={() => handleEdit(field, attendance, originalIndex)}
                  >
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={displayValue}
                        onChange={(e) => {
                          if (field === "dnShift") {
                            // Handle dnShift field specially
                            let input = e.target.value.toUpperCase();
                            if (input.length > 0) {
                              const lastChar = input.charAt(input.length - 1);
                              if (['A', 'D', 'N'].includes(lastChar)) {
                                input = lastChar;
                              } else {
                                input = 'D'; // Default to D if invalid input
                              }
                            }
                            handleChange({ target: { value: input } }, rowIndex, field, originalIndex);
                          } else {
                            handleChange(e, rowIndex, field, originalIndex);
                          }
                        }}
                        onKeyDown={(e) =>
                          onKeyDown(e, rowIndex, `${field}-${originalIndex}`, { field, index: originalIndex, originalValue: cellValue })
                        }
                        onBlur={() => {
                          if (field === "dnShift" && (!displayValue || !['A', 'D', 'N'].includes(displayValue))) {
                            handleChange({ target: { value: 'D' } }, rowIndex, field, originalIndex);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <div className={canEditThisCell ? "editable-cell" : ""}>
                        {field === "dnShift" && ['D', 'N', 'A'].includes(cellValue?.toUpperCase())
                          ? cellValue.charAt(0).toUpperCase()
                          : field === "dnShift" ? "" : cellValue}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {(!isAdmin || (isAdmin && isShowMetrixData)) && (
          <div className="total-data-cell">
            <div className="Disply-total-sub-data-cell">
              <div className="total sub-disply-total">N00</div>
              <div className="total sub-disply-total">O00</div>
              <div className="total sub-disply-total">N0</div>
              <div className="total sub-disply-total">Ne.00</div>
              <div className="total sub-disply-total">OT.00</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataRow;