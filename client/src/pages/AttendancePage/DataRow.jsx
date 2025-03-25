import React, { useState, useEffect } from "react";

function DataRow({
  row,
  rowIndex,
  hoveredRow,
  setHoveredRow,
  data,
  setData,
  onKeyDown,
  className,
}) {
  const [editableCell, setEditableCell] = useState(null);
  const [editValue, setEditValue] = useState({});

  // Handle edit action
  const handleEdit = (field, attendance, index) => {
    // Check if the specific attendance record is unlocked
    if (attendance.lock_status === "unlocked") {
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

  // Handle blur event
  const handleBlur = (rowIndex, column, index) => {
    const updatedData = [...data];
    const editKey = `${column}-${index}`;
    const value = editValue[editKey];

    // Format numeric fields
    if (column === "netHR" || column === "otHR") {
      if (!isNaN(parseFloat(value))) {
        const formattedValue = parseFloat(value).toFixed(1);
        updatedData[rowIndex].attendance[index][column] = formattedValue;
        
        // Update edit value with formatted value
        setEditValue(prev => ({
          ...prev,
          [editKey]: formattedValue
        }));
      }
    } else {
      // For non-numeric fields, update directly
      updatedData[rowIndex].attendance[index][column] = value;
    }

    setData(updatedData);
    setEditableCell(null);
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
        {row.attendance.map((attendance, index) => (
          <div key={index} className="date-cell">
            {["netHR", "otHR", "dnShift"].map((field) => {
              const editKey = `${field}-${index}`;
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
                  onClick={() => handleEdit(field, attendance, index)}
                >
                  {isEditable ? (
                    <input
                      type="text"
                      value={displayValue}
                      onChange={(e) =>
                        handleChange(e, rowIndex, field, index)
                      }
                      onBlur={() => handleBlur(rowIndex, field, index)}
                      onKeyDown={(e) =>
                        onKeyDown(e, rowIndex, `${field}-${index}`)
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
        ))}
      </div>
    </div>
  );
}

export default DataRow;