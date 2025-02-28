import React from 'react';
import './AttendancePage.css';

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
  onKeyDown
}) {
  const handleEdit = (column) => {
    if (isAdmin) {
      setEditableCell({ rowIndex, column });
    }
  };

  const handleChange = (e, rowIndex, column) => {
    const updatedData = [...data];
    const [field, index] = column.split('-');
    
    // Validate input based on field type
    let value = e.target.value;
    if (field === 'netHR' || field === 'otHR') {
      // Only allow numbers and decimal point
      value = value.replace(/[^0-9.]/g, '');
      
      // Prevent multiple decimal points
      const decimalCount = (value.match(/\./g) || []).length;
      if (decimalCount > 1) {
        value = value.substring(0, value.lastIndexOf('.'));
      }
    }
    
    updatedData[rowIndex].attendance[index][field] = value;
    setData(updatedData);
  };

  const handleBlur = (rowIndex, column) => {
    // Validate and format values on blur
    const updatedData = [...data];
    const [field, index] = column.split('-');
    const value = updatedData[rowIndex].attendance[index][field];
    
    if (field === 'netHR' || field === 'otHR') {
      // Format to one decimal place if it's a number
      if (!isNaN(parseFloat(value))) {
        updatedData[rowIndex].attendance[index][field] = parseFloat(value).toFixed(1);
        setData(updatedData);
      }
    }
    
    setEditableCell(null);
  };

  // Get CSS class based on shift type
  const getShiftClass = (shift) => {
    if (shift === 'Day') return 'dnShift-Day';
    if (shift === 'Night') return 'dnShift-Night';
    return '';
  };

  return (
    <div
      className={`data-row ${hoveredRow === rowIndex ? 'hovered' : ''}`}
      onMouseEnter={() => setHoveredRow(rowIndex)}
      onMouseLeave={() => setHoveredRow(null)}
    >
      {/* Fixed employee info cells */}
      <div className="fixed-data-cells">
        <div className="data-cell punch-code">{row.punchCode}</div>
        <div className="data-cell name">{row.name}</div>
        <div className="data-cell designation">{row.designation}</div>
        <div className="data-cell department">{row.department}</div>
      </div>
      
      {/* Scrollable attendance data cells */}
      <div className="scrollable-data-cells" id={`row-scroll-container-${rowIndex}`}>
        {row.attendance.map((attendance, index) => (
          <div key={index} className="date-cell">
            {['netHR', 'otHR', 'dnShift'].map((field) => {
              const isEditable = editableCell?.rowIndex === rowIndex && editableCell?.column === `${field}-${index}`;
              const cellValue = attendance[field];
              
              // Determine if this cell should be highlighted based on its value
              let className = "sub-date-cell";
              if (field === 'dnShift') {
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
                  data-tooltip={field === 'netHR' ? 'Net Hours' : field === 'otHR' ? 'Overtime Hours' : 'Day/Night Shift'}
                >
                  {isEditable ? (
                    <input
                      type="text"
                      value={cellValue}
                      onChange={(e) => handleChange(e, rowIndex, `${field}-${index}`)}
                      onBlur={() => handleBlur(rowIndex, `${field}-${index}`)}
                      onKeyDown={(e) => onKeyDown(e, rowIndex, `${field}-${index}`)}
                      autoFocus
                    />
                  ) : (
                    <div>
                      {field === 'dnShift' && (cellValue === 'Day' || cellValue === 'Night') ? (
                        cellValue.charAt(0)
                      ) : (
                        cellValue
                      )}
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