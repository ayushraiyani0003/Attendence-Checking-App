import React, { useEffect, memo, useCallback, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
    exceedsThreshold,
    getShiftClass,
    canEdit,
} from "../../utils/constants";
import "./DataRow.css";
import "./AddComment.css";
import CommentPopup from "./CommentPopup";
import useDataRow from "../../hooks/useDataRow";

// Define styles for the fixed popup
const commentPopupStyle = {
    position: "fixed",
    top: "10px",
    right: "10px",
    zIndex: 1000,
};

const DataRow = memo(function DataRow(props) {
    const {
        row,
        rowIndex,
        sequentialIndex,
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
        registerInputRef,
        handleVerticalKeyDown,

        popupOpen,
        setPopupOpen,
    } = props;

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
        setShowCommentPopup,
    } = useDataRow({
        ...props,
        registerInputRef,
        handleVerticalKeyDown,
    });

    // Add state to store the pinned row data
    const [pinnedRowData, setPinnedRowData] = useState(null);

    // Register the input ref whenever it changes - using BOTH sequential index and employee ID
    useEffect(() => {
        if (inputRef.current && editableCell) {
            registerInputRef(
                sequentialIndex,
                row.id,
                editableCell,
                inputRef.current
            );
        }
    }, [inputRef.current, editableCell, sequentialIndex, row.id, registerInputRef]);

    // Memoized navigation event handler
    const handleNavigationEvent = useCallback(
        (event) => {
            try {
                if (
                    event.detail.rowIndex === sequentialIndex ||
                    event.detail.employeeId === row.id
                ) {
                    setEditableCell(event.detail.cellKey);

                    // Use requestAnimationFrame instead of setTimeout for better performance
                    requestAnimationFrame(() => {
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
                    });
                }
            } catch (err) {
                console.error("Error handling navigation event:", err);
            }
        },
        [sequentialIndex, row.id, setEditableCell, inputRef]
    );

    // Memoized clear event handler
    const handleClearEvent = useCallback(
        (event) => {
            try {
                if (
                    event.detail.rowIndex === sequentialIndex ||
                    event.detail.employeeId === row.id
                ) {
                    if (editableCell) {
                        const [field, indexStr] = editableCell.split("-");
                        const colIndex = parseInt(indexStr);

                        if (displayData && displayData[colIndex]) {
                            const editKey = `${editableCell}`;
                            let currentValue =
                                editValue[editKey] ||
                                displayData[colIndex]?.[field] ||
                                "0";
                            currentValue = String(currentValue);

                            let formattedValue = currentValue;
                            if (field === "dnShift") {
                                formattedValue = currentValue.toUpperCase();
                                if (
                                    !["1S", "2S", "3S", "GS"].includes(
                                        formattedValue
                                    )
                                ) {
                                    formattedValue = "GS";
                                }
                            } else {
                                if (isNaN(parseFloat(currentValue))) {
                                    formattedValue = "0";
                                } else {
                                    formattedValue =
                                        parseFloat(currentValue).toString();
                                }
                            }

                            const attendanceDate = displayData[colIndex]?.date;
                            if (attendanceDate) {
                                const employeeId = row.id;
                                onCellUpdate(
                                    employeeId,
                                    attendanceDate,
                                    field,
                                    formattedValue
                                );
                            }
                        }
                    }

                    setEditableCell(null);
                }
            } catch (err) {
                console.error("Error handling clear event:", err);
            }
        },
        [
            sequentialIndex,
            row.id,
            editableCell,
            editValue,
            displayData,
            onCellUpdate,
            setEditableCell,
        ]
    );

    // Add event listeners for this specific row
    useEffect(() => {
        document.addEventListener("verticalNavigate", handleNavigationEvent);
        document.addEventListener("clearEditableCell", handleClearEvent);

        return () => {
            document.removeEventListener(
                "verticalNavigate",
                handleNavigationEvent
            );
            document.removeEventListener("clearEditableCell", handleClearEvent);
        };
    }, [handleNavigationEvent, handleClearEvent]);

    // Modified onKeyDown to pass both sequential index and employee ID - memoized
    const handleModifiedKeyDown = useCallback(
        (e, cellKey) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                handleVerticalKeyDown(e, sequentialIndex, row.id, cellKey);
            } else {
                onKeyDown(e, cellKey);
            }
        },
        [sequentialIndex, row.id, handleVerticalKeyDown, onKeyDown]
    );

    // Determine whether to show metrix display - memoized
    const shouldShowMetrixDisplay = useMemo(
        () => isAdmin && props.isShowDiffData,
        [isAdmin, props.isShowDiffData]
    );

    // Helper function to determine diff background color - memoized
    const getDiffBgClass = useCallback((value) => {
        if (!value) return "";
        const numValue = parseFloat(value);
        return numValue !== 0 ? "bg-red-100" : "";
    }, []);

    // Memoize row class name calculation
    const rowClassName = useMemo(() => {
        return `data-row ${hoveredRow === rowIndex ? "hovered" : ""}${
            hasAnyComments() ? " has-comments" : ""
        } 
    ${rowIndex % 2 === 0 ? "even-row" : "odd-row"}`;
    }, [hoveredRow, rowIndex, hasAnyComments]);

    // Memoize fixed data cells class name
    const fixedDataCellsClassName = useMemo(
        () => `fixed-data-cells ${rowIndex % 2 === 0 ? "even-row" : "odd-row"}`,
        [rowIndex]
    );

    // Updated row click handler
    const handleClick = useCallback(() => {
        // If this row has comments, show the popup
        if (hasAnyComments()) {
            // Store the current row data when pinning the popup open
            setPinnedRowData(row);
            setShowCommentPopup(true);
            setPopupOpen(true);
        } else {
            // If this row has no comments and a popup is currently open, close it
            if (showCommentPopup || popupOpen) {
                setShowCommentPopup(false);
                setPopupOpen(false);
                setPinnedRowData(null); // Clear pinned data when closing
            }
        }
    }, [hasAnyComments, showCommentPopup, popupOpen, setShowCommentPopup, row]);

    // Updated mouse enter handler - show popup on hover only if no popup is currently open
    const handleMouseEnter = useCallback(() => {
        console.log("handleMouseEnter called");
        console.log(popupOpen);

        // Only show comment popup on hover if no popup is currently open AND this row has comments
        if (!popupOpen && hasAnyComments()) {
            setHoveredRow(rowIndex);
            handleShowCommentPopup();
        }
    }, [
        rowIndex,
        setHoveredRow,
        popupOpen,
        hasAnyComments,
        handleShowCommentPopup,
    ]);

    // Updated mouse leave handler - close popup on mouse leave only if it was opened by hover (not by click)
    const handleMouseLeave = useCallback(() => {
        setHoveredRow(null);
        // Only close popup on mouse leave if no popup is permanently open (clicked)
        if (!popupOpen && showCommentPopup) {
            setShowCommentPopup(false);
        }
    }, [setHoveredRow, popupOpen, showCommentPopup, setShowCommentPopup]);

    // Updated close comment popup handler
    const handleCloseCommentPopupUpdated = useCallback(() => {
        setShowCommentPopup(false);
        setPopupOpen(false);
        setPinnedRowData(null); // Clear pinned data when closing
        if (handleCloseCommentPopup) {
            handleCloseCommentPopup();
        }
    }, [setShowCommentPopup, handleCloseCommentPopup]);

    // Memoize the total data cell markup
    const totalDataCell = useMemo(() => {
        // Show for non-admin users OR for admin users when isShowMetrixData is true
        if (isAdmin && !props.isShowMetrixData) return null;

        return (
            <div
                className={`total-data-cell ${
                    rowIndex % 2 === 0 ? "even-row" : "odd-row"
                }`}
                title={row.punchCode + ` - ` + row.name}
            >
                <div
                    className={`Disply-total-sub-data-cell ${
                        rowIndex % 2 === 0 ? "even-row" : "odd-row"
                    }`}
                >
                    <div className="total sub-disply-total">
                        {totalNetHR.toFixed(2)}
                    </div>
                    <div className="total sub-disply-total">
                        {totalOtHR.toFixed(2)}
                    </div>
                    <div
                        className={`total sub-disply-total ${getDiffBgClass(
                            netDiffValue[row.punchCode]
                        )}`}
                    >
                        {netDiffValue[row.punchCode] || "0.00"}
                    </div>
                    <div
                        className={`total sub-disply-total ${getDiffBgClass(
                            otDiffValue[row.punchCode]
                        )}`}
                    >
                        {otDiffValue[row.punchCode] || "0.00"}
                    </div>
                    <div className="total sub-disply-total">
                        {nightShiftCount}
                    </div>
                    <div className="total sub-disply-total">
                        {eveningShiftCount}
                    </div>
                    <div className="total sub-disply-total">
                        {siteCommentCount}
                    </div>
                    <div className="total sub-disply-total absent-count">
                        {absentCount}
                    </div>
                </div>
            </div>
        );
    }, [
        isAdmin,
        props.isShowMetrixData,
        rowIndex,
        row.punchCode,
        row.name,
        totalNetHR,
        totalOtHR,
        getDiffBgClass,
        netDiffValue,
        otDiffValue,
        nightShiftCount,
        eveningShiftCount,
        siteCommentCount,
        absentCount,
    ]);

    // Render a cell based on its data - extracted to reduce render complexity
    const renderCell = useCallback(
        (field, attendance, originalIndex, hasComment, hasSiteComment) => {
            const editKey = `${field}-${originalIndex}`;
            const isEditing = editableCell === editKey;
            const canEditThisCell = canEdit(
                attendance,
                isAdmin,
                props.isShowDiffData
            );

            let cellValue =
                attendance[field] || (field === "dnShift" ? "" : "0");
            if (field === "dnShift" && cellValue) {
                cellValue = cellValue.toUpperCase();
            }

            const displayValue = isEditing
                ? editValue[editKey] ?? cellValue
                : cellValue;

            let className = "sub-date-cell";
            if (field === "dnShift") {
                className += ` ${getShiftClass(cellValue)}`;
            }
            if (isEditing) {
                className += " editable";
            }
            if (
                field === "netHR" &&
                shouldShowMetrixDisplay &&
                attendance.netHRExceeds
            ) {
                className += " exceeds-threshold";
            }
            if (
                field === "otHR" &&
                shouldShowMetrixDisplay &&
                attendance.otHRExceeds
            ) {
                className += " exceeds-threshold";
            }
            if (hasComment && field !== "dnShift") {
                className += " gray-comment";
            }
            if (hasSiteComment && field !== "dnShift") {
                className += " site-comment";
            }

            const handleCellClick = () =>
                handleEdit(field, attendance, originalIndex);
            const cellTitle = `${row.punchCode} - ${row.name}${
                hasComment
                    ? `: ${attendance.comment}`
                    : ": Double-click to add comment"
            }`;

            return (
                <div
                    key={field}
                    className={className}
                    onClick={handleCellClick}
                    title={cellTitle}
                    data-cell-id={`${row.id}-${field}-${originalIndex}`}
                >
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={displayValue}
                            onChange={(e) =>
                                handleChange(e, field, originalIndex)
                            }
                            onKeyDown={(e) =>
                                handleModifiedKeyDown(
                                    e,
                                    `${field}-${originalIndex}`
                                )
                            }
                            onBlur={() => {
                                if (
                                    field === "dnShift" &&
                                    (!displayValue ||
                                        !["1S", "2S", "3S", "GS"].includes(
                                            displayValue
                                        ))
                                ) {
                                    handleChange(
                                        { target: { value: "GS" } },
                                        field,
                                        originalIndex
                                    );
                                }
                            }}
                            autoFocus
                        />
                    ) : (
                        <div className={canEditThisCell ? "editable-cell" : ""}>
                            {field === "dnShift" &&
                            ["1S", "2S", "3S", "GS"].includes(
                                cellValue?.toUpperCase()
                            )
                                ? cellValue.toUpperCase()
                                : field === "dnShift"
                                ? ""
                                : cellValue}
                        </div>
                    )}
                </div>
            );
        },
        [
            editableCell,
            isAdmin,
            props.isShowDiffData,
            editValue,
            shouldShowMetrixDisplay,
            row.punchCode,
            row.name,
            row.id,
            inputRef,
            handleEdit,
            handleChange,
            handleModifiedKeyDown,
        ]
    );

    // Memoize the comment popup render function
    const renderCommentPopup = useCallback(() => {
        if (!showCommentPopup) return null;

        // Use pinned row data if popup is open (clicked), otherwise use current row data
        const rowDataToUse = popupOpen ? pinnedRowData : row;

        return ReactDOM.createPortal(
            <div style={commentPopupStyle}>
                <CommentPopup
                    rowData={rowDataToUse}
                    onClose={handleCloseCommentPopupUpdated}
                />
            </div>,
            document.body
        );
    }, [
        showCommentPopup,
        popupOpen,
        pinnedRowData,
        row,
        handleCloseCommentPopupUpdated,
    ]);

    return (
        <div
            className={rowClassName}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            ref={rowRef}
            data-row-id={row.id}
            data-employee-id={row.id}
            data-sequential-index={sequentialIndex}
            data-employee-name={row.name}
            data-punch-code={row.punchCode}
        >
            <div className={fixedDataCellsClassName}>
                <div
                    className={`data-cell punch-code ${
                        rowIndex % 2 === 0 ? "even-row" : "odd-row"
                    }`}
                >
                    {row.punchCode}
                </div>
                <div
                    className={`data-cell name ${
                        rowIndex % 2 === 0 ? "even-row" : "odd-row"
                    }`}
                >
                    {row.name}
                </div>
                <div
                    className={`data-cell designation ${
                        rowIndex % 2 === 0 ? "even-row" : "odd-row"
                    }`}
                >
                    {row.designation}
                </div>
                <div
                    className={`data-cell department ${
                        rowIndex % 2 === 0 ? "even-row" : "odd-row"
                    }`}
                >
                    {row.department}
                </div>
            </div>

            <div className="scrollable-data-cells" id="body-scrollable">
                {displayData.map((attendance, displayIndex) => {
                    if (!attendance) return null;

                    const originalIndex = displayIndex;
                    const hasComment =
                        attendance.comment && attendance.comment.trim() !== "";
                    const hasSiteComment =
                        attendance.comment &&
                        attendance.comment.trim() !== "" &&
                        attendance.comment
                            .trim()
                            .toLowerCase()
                            .startsWith("site");

                    return (
                        <div
                            key={displayIndex}
                            className="date-cell"
                            onDoubleClick={() =>
                                handleAddComment(attendance, originalIndex)
                            }
                            title={row.punchCode + ` - ` + row.name}
                        >
                            {["netHR", "otHR", "dnShift"].map((field) =>
                                renderCell(
                                    field,
                                    attendance,
                                    originalIndex,
                                    hasComment,
                                    hasSiteComment
                                )
                            )}
                        </div>
                    );
                })}

                {totalDataCell}
            </div>

            {renderCommentPopup()}
        </div>
    );
});

export default DataRow;
