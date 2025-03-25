import React, { useState } from "react";

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

  // Handle edit action
  const handleEdit = (field, attendance, index) => {
    // Check if the specific attendance record is unlocked
    if (attendance.lock_status === "unlocked") {
      setEditableCell(`${field}-${index}`);
    } else {
      alert("Editing is not allowed. This record is locked.");
    }
  };

  // Handle input change
  const handleChange = (e, rowIndex, column, index) => {
    const updatedData = [...data];
    let value = e.target.value;

    // Sanitize numeric input for netHR and otHR
    if (column === "netHR" || column === "otHR") {
      value = value.replace(/[^0-9.]/g, "");
      const decimalCount = (value.match(/\./g) || []).length;
      if (decimalCount > 1) {
        value = value.substring(0, value.lastIndexOf("."));
      }
    }

    // Update the specific field
    updatedData[rowIndex].attendance[index][column] = value;
    setData(updatedData);
  };

  // Handle blur event
  const handleBlur = (rowIndex, column, index) => {
    const updatedData = [...data];
    const value = updatedData[rowIndex].attendance[index][column];

    // Format numeric fields
    if (column === "netHR" || column === "otHR") {
      if (!isNaN(parseFloat(value))) {
        updatedData[rowIndex].attendance[index][column] = 
          parseFloat(value).toFixed(1);
        setData(updatedData);
      }
    }

    // Reset editable cell
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
            {["netHR", "otHR", "dnShift", "lock_status"].map((field) => {
              const isEditable = editableCell === `${field}-${index}`;
              const cellValue = attendance[field];
              console.log(cellValue);

              let className = "sub-date-cell";
              if (field === "dnShift") {
                className += ` ${getShiftClass(cellValue)}`;
              }
              if (isEditable) {
                className += " editable";
              }

              // Skip rendering lock_status as an editable field
              if (field === "lock_status") return null;

              return (
                <div
                  key={field}
                  className={className}
                  onClick={() => handleEdit(field, attendance, index)}
                >
                  {isEditable ? (
                    <input
                      type="text"
                      value={cellValue}
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