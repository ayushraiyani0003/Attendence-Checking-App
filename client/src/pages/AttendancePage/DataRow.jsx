import React, { useEffect, useRef } from "react";

function DataRow({
  row,
  rowIndex,
  hoveredRow,
  setHoveredRow,
  editableCell,
  setEditableCell,
  data,
  setData,
  isAdmin,
  onKeyDown,
}) {
  const handleEdit = (column) => {
    if (isAdmin) {
      setEditableCell({ rowIndex, column });
    }
  };

  const handleChange = (e, rowIndex, column) => {
    const updatedData = [...data];
    const [field, index] = column.split("-");

    let value = e.target.value;
    if (field === "netHR" || field === "otHR") {
      value = value.replace(/[^0-9.]/g, "");
      const decimalCount = (value.match(/\./g) || []).length;
      if (decimalCount > 1) {
        value = value.substring(0, value.lastIndexOf("."));
      }
    }

    updatedData[rowIndex].attendance[index][field] = value;
    setData(updatedData);
  };

  const handleBlur = (rowIndex, column) => {
    const updatedData = [...data];
    const [field, index] = column.split("-");
    const value = updatedData[rowIndex].attendance[index][field];

    if (field === "netHR" || field === "otHR") {
      if (!isNaN(parseFloat(value))) {
        updatedData[rowIndex].attendance[index][field] =
          parseFloat(value).toFixed(1);
        setData(updatedData);
      }
    }

    setEditableCell(null);
  };

  // Define the getShiftClass function
  const getShiftClass = (shift) => {
    if (shift === "Day") return "dnShift-Day"; // Class for Day shift
    if (shift === "Night") return "dnShift-Night"; // Class for Night shift
    return ""; // Default case, if shift is neither 'Day' nor 'Night'
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
              const isEditable =
                editableCell?.rowIndex === rowIndex &&
                editableCell?.column === `${field}-${index}`;
              const cellValue = attendance[field];

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
                  onClick={() => handleEdit(`${field}-${index}`)}
                >
                  {isEditable ? (
                    <input
                      type="text"
                      value={cellValue}
                      onChange={(e) =>
                        handleChange(e, rowIndex, `${field}-${index}`)
                      }
                      onBlur={() => handleBlur(rowIndex, `${field}-${index}`)}
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
