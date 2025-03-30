import React, { useState, useEffect, useRef } from "react";

function DataRow({
  row,
  rowIndex,
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
  isShowMetrixData
}) {
  const [editableCell, setEditableCell] = useState(null);
  const [editValue, setEditValue] = useState({});
  const inputRef = useRef(null);

    // Check if user is an admin
    const isAdmin = user.role === "admin";

  // Filter attendance data based on displayWeeks
  const filteredAttendance = row.attendance.filter((_, index) => {
    // If displayWeeks is 0, show all columns
    if (displayWeeks === 0) return true;
    
    // Calculate index range for the given week
    const startIndex = (displayWeeks - 1) * 7;
    const endIndex = displayWeeks * 7 - 1;
    
    // Show only columns within the index range
    return index >= startIndex && index <= endIndex;
  });

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
          const currentValue = editValue[editKey] || row.attendance[colIndex][currentField];

          // Only update if the value has actually changed
          const hasValueChanged = currentValue !== row.attendance[colIndex][currentField];

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
  }, [editableCell, editValue, row, rowIndex, onCellUpdate]);

  // Determine if the user can edit based on lock status and user role
  const canEdit = (attendance) => {
    const isUnlocked = attendance.lock_status === "unlocked";
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
      alert("Editing is not allowed. This record is locked.");
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
        // Remove trailing zeros and decimal point if no significant digits after decimal
        return parsedFloat % 1 === 0
          ? parseInt(parsedFloat)
          : parsedFloat;
      }
    }
    return value;
  };

  // Key down handler with intelligent update
  const onKeyDown = (e, rowIndex, column, currentCellInfo) => {
    if (e.key === "Tab") {
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
        if (currentColIndex < fullData[currentRowIndex].attendance.length - 1) {
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
        {filteredAttendance.map((attendance, displayIndex) => {
          // Calculate the original index in the full attendance array
          const originalIndex = displayWeeks === 0 
            ? displayIndex 
            : (displayWeeks - 1) * 7 + displayIndex;
            
          return (
            <div key={displayIndex} className="date-cell">
              {["netHR", "otHR", "dnShift"].map((field) => {
                const editKey = `${field}-${originalIndex}`;
                const isEditable = editableCell === editKey;
                const cellValue = attendance[field];
                const displayValue = isEditable
                  ? (editValue[editKey] ?? cellValue)
                  : cellValue;

                let className = "sub-date-cell";
                if (field === "dnShift") {
                  className += ` ${getShiftClass(cellValue)}`;
                }
                if (isEditable) {
                  className += " editable";
                }

                return (
                  <div
                    key={field}
                    className={className}
                    onClick={() => handleEdit(field, attendance, originalIndex)}
                  >
                    {isEditable ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={displayValue}
                        onChange={(e) =>
                          handleChange(e, rowIndex, field, originalIndex)
                        }
                        onKeyDown={(e) =>
                          onKeyDown(e, rowIndex, `${field}-${originalIndex}`, { field, index: originalIndex, originalValue: cellValue })
                        }
                        autoFocus
                      />
                    ) : (
                      <div>
                        {field === "dnShift" &&
                          (cellValue === "Day" || cellValue === "Night")
                          ? cellValue.charAt(0)
                          : cellValue}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
        
        {isAdmin && isShowMetrixData &&(
        <div className="total-data-cell">
          <div className="Disply-total-sub-data-cell">
            <div className="sub-disply-total">Net HR</div>
            <div className="sub-disply-total">OT HR</div>
            <div className="sub-disply-total">D/A/N</div>
            <div className="sub-disply-total">D/A/N</div>
            <div className="sub-disply-total">D/A/N</div>
          </div>
        </div>)}
      </div>
    </div>
  );
}

export default DataRow;