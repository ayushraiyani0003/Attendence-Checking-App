import React, { useEffect } from "react";
import { exceedsThreshold, getShiftClass, canEdit } from "../../utils/constants";
import "./DataRow.css";
import "./AddComment.css";
import CommentPopup from './CommentPopup';
import useDataRow from "../../hooks/useDataRow";

function DataRow(props) {
  const {
    row,
    rowIndex,
    sequentialIndex, // The sequential index in filtered data
    hoveredRow,
    isAdmin,
    setHoveredRow,
    user,
    totalNetHR,
    totalOtHR,
    nightShiftCount,
    eveningShiftCount,
    siteCommentCount,
    absentCount,
    onCellUpdate,
    // Navigation props
    registerInputRef,
    handleVerticalKeyDown
  } = props;

  // Use custom hook for logic with vertical navigation props
  const {
    editableCell,
    setEditableCell,
    editValue,
    netDiffValue,
    otDiffValue,
    showCommentPopup,
    inputRef,
    rowRef,
    displayData,
    handleEdit,
    handleAddComment,
    handleChange,
    onKeyDown,
    hasAnyComments,
    handleCloseCommentPopup,
    handleShowCommentPopup,
    setShowCommentPopup
  } = useDataRow({
    ...props,
    registerInputRef,
    handleVerticalKeyDown
  });

  // Register the input ref whenever it changes - using BOTH sequential index and employee ID
  useEffect(() => {
    if (inputRef.current && editableCell) {
      // Pass both the sequential index and employee ID
      registerInputRef(sequentialIndex, row.id, editableCell, inputRef.current);
    }
  }, [inputRef.current, editableCell, sequentialIndex, row.id, registerInputRef]);

  // Add event listeners for this specific row
  useEffect(() => {
    // Handler for receiving navigation events
    const handleNavigationEvent = (event) => {
      try {
        // Match EITHER by sequential index OR by employee ID
        if ((event.detail.rowIndex === sequentialIndex) ||
          (event.detail.employeeId === row.id)) {

          // console.log(`Row ${sequentialIndex} (Employee ${row.id}) received navigation event for cell ${event.detail.cellKey}`);

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
        // Match EITHER by sequential index OR by employee ID
        if ((event.detail.rowIndex === sequentialIndex) ||
          (event.detail.employeeId === row.id)) {

          // console.log(`Row ${sequentialIndex} (Employee ${row.id}) clearing editable state`);

          // Save any pending changes before clearing
          if (editableCell) {
            const [field, indexStr] = editableCell.split('-');
            const colIndex = parseInt(indexStr);

            // Safety check
            if (displayData && displayData[colIndex]) {
              // Get current edit value
              const editKey = `${editableCell}`;
              let currentValue = editValue[editKey] || displayData[colIndex]?.[field] || "0";
              currentValue = String(currentValue);

              // Apply value formatting
              let formattedValue = currentValue;
              if (field === "dnShift") {
                formattedValue = currentValue.toUpperCase();
                if (!['D', 'N', 'E'].includes(formattedValue)) {
                  formattedValue = 'D'; // Default
                }
              } else {
                // For numeric fields
                if (isNaN(parseFloat(currentValue))) {
                  formattedValue = "0";
                } else {
                  formattedValue = parseFloat(currentValue).toString();
                }
              }

              const attendanceDate = displayData[colIndex]?.date;
              if (attendanceDate) {
                // Use the employee ID directly for the update
                const employeeId = row.id;
                // console.log(`Saving ${field}=${formattedValue} for date ${attendanceDate} for employee ID ${employeeId}`);
                onCellUpdate(employeeId, attendanceDate, field, formattedValue);
              }
            }
          }

          // Now clear the editable state
          setEditableCell(null);
        }
      } catch (err) {
        console.error("Error handling clear event:", err);
      }
    };

    // Add event listeners
    document.addEventListener('verticalNavigate', handleNavigationEvent);
    document.addEventListener('clearEditableCell', handleClearEvent);

    // Clean up event listeners
    return () => {
      document.removeEventListener('verticalNavigate', handleNavigationEvent);
      document.removeEventListener('clearEditableCell', handleClearEvent);
    };
  }, [sequentialIndex, row.id, editableCell, editValue, displayData, onCellUpdate, setEditableCell, inputRef]);

  // Modified onKeyDown to pass both sequential index and employee ID
  const handleModifiedKeyDown = (e, cellKey) => {
    // When handling key events, pass the sequential index to the parent navigation handler
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      
      // Call the vertical navigation handler with the sequential index and employee ID
      // console.log(`Row ${sequentialIndex} (Employee ${row.id}) pressed ${e.key} in cell ${cellKey}`);
      
      // The key is to pass the sequentialIndex here, not the rowIndex
      handleVerticalKeyDown(e, sequentialIndex, row.id, cellKey);
    } else {
      // For other keys, use the original handler
      onKeyDown(e, cellKey);
    }
  };

  // Determine whether to show metrix display
  const shouldShowMetrixDisplay = isAdmin && props.isShowDiffData;

  // Helper function to determine diff background color
  const getDiffBgClass = (value) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    return numValue !== 0 ? 'bg-red-100' : '';
  };

  return (
    <div
      className={`data-row ${hoveredRow === rowIndex ? "hovered" : ""}${hasAnyComments() ? "has-comments" : ""} 
      ${rowIndex % 2 === 0 ? "even-row" : "odd-row"}`}
      onMouseEnter={() => {
        setHoveredRow(rowIndex);
        handleShowCommentPopup();
      }}
      onMouseLeave={() => {
        setHoveredRow(null);
        setShowCommentPopup(false);
      }}
      ref={rowRef}
      data-row-id={row.id}
      data-employee-id={row.id}
      data-sequential-index={sequentialIndex} // Add sequential index attribute

      data-employee-name={row.name}
      data-punch-code={row.punchCode}
    >
      <div className={`fixed-data-cells ${rowIndex % 2 === 0 ? "even-row" : "odd-row"}`}>
        <div className={`data-cell punch-code ${rowIndex % 2 === 0 ? "even-row" : "odd-row"}`}>{row.punchCode}</div>
        <div className={`data-cell name ${rowIndex % 2 === 0 ? "even-row" : "odd-row"}`}>{row.name}</div>
        <div className={`data-cell designation ${rowIndex % 2 === 0 ? "even-row" : "odd-row"}`}>{row.designation}</div>
        <div className={`data-cell department ${rowIndex % 2 === 0 ? "even-row" : "odd-row"}`}>{row.department}</div>
      </div>

      <div className="scrollable-data-cells" id="body-scrollable">
        {displayData.map((attendance, displayIndex) => {
          if (!attendance) return null;

          // Calculate the original index in the full attendance array
          const originalIndex = displayIndex;

          // Check if this date has a comment
          const hasComment = attendance.comment && attendance.comment.trim() !== "";
          const hasSiteComment = attendance.comment &&
            attendance.comment.trim() !== "" &&
            attendance.comment.trim().toLowerCase().startsWith("site");

          return (
            <div
              key={displayIndex}
              className="date-cell"
              onDoubleClick={() => handleAddComment(attendance, originalIndex)}
              title={row.punchCode + ` - ` + row.name}
            >
              {["netHR", "otHR", "dnShift"].map((field) => {
                const editKey = `${field}-${originalIndex}`;
                const isEditing = editableCell === editKey;
                const canEditThisCell = canEdit(attendance, isAdmin, props.isShowDiffData);

                // Get the appropriate value to display
                let cellValue = attendance[field] || (field === "dnShift" ? "" : "0");
                if (field === "dnShift" && cellValue) {
                  cellValue = cellValue.toUpperCase();
                }

                const displayValue = isEditing
                  ? (editValue[editKey] ?? cellValue)
                  : cellValue;

                // Build class name
                let className = "sub-date-cell";
                if (field === "dnShift") {
                  className += ` ${getShiftClass(cellValue)}`;
                }
                if (isEditing) {
                  className += " editable";
                }
                if (field === "netHR" && shouldShowMetrixDisplay && attendance.netHRExceeds) {
                  className += " exceeds-threshold";
                }
                if (field === "otHR" && shouldShowMetrixDisplay && attendance.otHRExceeds) {
                  className += " exceeds-threshold";
                }
                // Add gray-comment class if this date has a comment
                if (hasComment && field !== "dnShift") {
                  className += " gray-comment";
                }
                if (hasSiteComment && field !== "dnShift") {
                  className += " site-comment";
                }

                return (
                  <div
                    key={field}
                    className={className}
                    onClick={() => handleEdit(field, attendance, originalIndex)}
                    title={`${row.punchCode} - ${row.name}${hasComment ? `: ${attendance.comment}` : ": Double-click to add comment"}`}
                    data-cell-id={`${row.id}-${field}-${originalIndex}`}
                  >
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={displayValue}
                        onChange={(e) => handleChange(e, field, originalIndex)}
                        onKeyDown={(e) => handleModifiedKeyDown(e, `${field}-${originalIndex}`)}
                        onBlur={() => {
                          // Handle special case for dnShift
                          if (field === "dnShift" && (!displayValue || !['E', 'D', 'N'].includes(displayValue))) {
                            handleChange({ target: { value: 'D' } }, field, originalIndex);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <div className={canEditThisCell ? "editable-cell" : ""}>
                        {field === "dnShift" && ['D', 'N', 'E'].includes(cellValue?.toUpperCase())
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

        {(!isAdmin || (isAdmin && props.isShowMetrixData)) && (
          <div className={`total-data-cell ${rowIndex % 2 === 0 ? "even-row" : "odd-row"}`} title={row.punchCode + ` - ` + row.name}>
            <div className={`Disply-total-sub-data-cell ${rowIndex % 2 === 0 ? "even-row" : "odd-row"}`}>
              <div className="total sub-disply-total">{totalNetHR.toFixed(2)}</div>
              <div className="total sub-disply-total">{totalOtHR.toFixed(2)}</div>
              <div className={`total sub-disply-total ${getDiffBgClass(netDiffValue[row.punchCode])}`}>
                {netDiffValue[row.punchCode] || '0.00'}
              </div>
              <div className={`total sub-disply-total ${getDiffBgClass(otDiffValue[row.punchCode])}`}>
                {otDiffValue[row.punchCode] || '0.00'}
              </div>
              <div className="total sub-disply-total">{nightShiftCount}</div>
              <div className="total sub-disply-total">{eveningShiftCount}</div>
              <div className="total sub-disply-total">{siteCommentCount}</div>
              <div className="total sub-disply-total absent-count">{absentCount}</div>
            </div>
          </div>
        )}
      </div>

      {/* Comment popup displayed at top right of screen with fixed position */}
      {showCommentPopup && (
        <CommentPopup
          rowData={row}
          onClose={handleCloseCommentPopup}
        />
      )}
    </div>
  );
}

export default DataRow;