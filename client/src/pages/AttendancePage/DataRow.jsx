import {React} from "react";
import { exceedsThreshold, getShiftClass, canEdit } from "../../utils/constants";
import "./DataRow.css";
import "./AddComment.css";
import CommentPopup from './CommentPopup';
import useDataRow from "../../hooks/useDataRow";

function DataRow(props) {
  const {
    row, rowIndex, hoveredRow, isAdmin, setHoveredRow, user,
  } = props;

  // Use custom hook for logic
  const {
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
    displayData,
    handleEdit,
    handleAddComment,
    handleChange,
    onKeyDown,
    hasAnyComments,
    handleCloseCommentPopup,
    handleShowCommentPopup,
    setShowCommentPopup
  } = useDataRow(props);

  console.log("Net Diff Values:", netDiffValue);
  console.log("OT Diff Values:", otDiffValue);
  
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
      className={`data-row ${hoveredRow === rowIndex ? "hovered" : ""}${hasAnyComments() ? "has-comments" : ""}`}
      onMouseEnter={() => {
        setHoveredRow(rowIndex);
        handleShowCommentPopup();
      }}
      onMouseLeave={() => {
        setHoveredRow(null);
        setShowCommentPopup(false);
      }}
      ref={rowRef}
    >
      <div className="fixed-data-cells">
        <div className="data-cell punch-code">{row.punchCode}</div>
        <div className="data-cell name">{row.name}</div>
        <div className="data-cell designation">{row.designation}</div>
        <div className="data-cell department">{row.department}</div>
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
              title={hasComment ? `Comment: ${attendance.comment}` : "Double-click to add comment"}
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
                if(hasSiteComment && field !== "dnShift"){
                  className += " site-comment";
                } 

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
                        onChange={(e) => handleChange(e, field, originalIndex)}
                        onKeyDown={(e) => onKeyDown(e, `${field}-${originalIndex}`)}
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
          <div className="total-data-cell">
            <div className="Disply-total-sub-data-cell">
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