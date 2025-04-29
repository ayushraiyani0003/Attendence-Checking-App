import React, { useState, useRef, useCallback, useMemo } from "react";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockUnlockPopup from "./lockUnlockPopup";
import { useUsers } from "../../hooks/userList";
import "./AttendanceHeader.css";

/**
 * AttendanceHeader component with optimized performance
 */
const AttendanceHeader = React.memo(
    ({
        columns,
        isAdmin,
        onSort,
        sortConfig,
        handleLock,
        handleUnlock,
        popupOpen,
        setPopupOpen,
        isShowMetrixData,
        lockUnlock,
        attDateStart,
        attDateEnd,
    }) => {
        const { users } = useUsers(); // Fetch reporting groups
        const [selectedDate, setSelectedDate] = useState(null);
        const [popupPosition, setPopupPosition] = useState({ left: 0 });
        const headerRef = useRef(null);

        // Memoized sort icon renderer
        const renderSortIcon = useCallback(
            (key) => {
                if (sortConfig && sortConfig.key === key) {
                    return sortConfig.direction === "ascending" ? " ↑" : " ↓";
                }
                return null;
            },
            [sortConfig]
        );

        // Optimized handleLockClick function
        const handleLockClick = useCallback(
            (e, attendance) => {
                // Only proceed if user is Admin
                if (!isAdmin) {
                    // Redirect to the AttendanceUnlockPage
                    const currentPath = window.location.pathname;
                    const basePathMatch = currentPath.match(/^(\/[^\/]+)/);
                    const basePath = basePathMatch ? basePathMatch[0] : "";

                    // Create URL with query parameters
                    const params = new URLSearchParams();
                    params.append("date", attendance.date);

                    // Navigate to the unlock page with parameters
                    window.location.href = `${basePath}/request-edit?${params.toString()}`;
                    return;
                }

                // Admin behavior
                e.stopPropagation();

                // Calculate position of the popup
                const columnElement = e.currentTarget;
                if (!columnElement) return;

                const columnRect = columnElement.getBoundingClientRect();

                // Position popup at the center of the clicked column
                const leftPosition = columnRect.left + columnRect.width / 2;

                setPopupPosition({ left: leftPosition });
                setSelectedDate(attendance.date);
                setPopupOpen(true);
            },
            [isAdmin, setPopupOpen]
        );

        // Optimized popup close handler
        const handlePopupClose = useCallback(() => {
            if (!isAdmin) return;
            setPopupOpen(false);
        }, [isAdmin, setPopupOpen]);

        // Memoized filtered columns to avoid recalculating on every render
        const filteredColumns = useMemo(() => {
            if (!columns || !Array.isArray(columns)) return [];
            if (!attDateStart || !attDateEnd) return columns;

            try {
                // Parse filter dates (ISO format)
                const startDate = new Date(attDateStart);
                const endDate = new Date(attDateEnd);

                // Filter columns by date range
                return columns.filter((attendance) => {
                    if (!attendance || !attendance.date) return false;

                    // Parse attendance date (DD/MM/YYYY format)
                    const [day, month, year] = attendance.date.split("/");
                    const attDate = new Date(year, month - 1, day);

                    // Show only columns within the date range
                    return attDate >= startDate && attDate <= endDate;
                });
            } catch (error) {
                console.error("Error filtering columns by date range:", error);
                return columns;
            }
        }, [columns, attDateStart, attDateEnd]);

        // Memoized fixed column headers
        const fixedColumnHeaders = useMemo(() => {
            const headers = [
                { key: "punchCode", label: "Punch Code" },
                { key: "name", label: "Name" },
                { key: "designation", label: "Designation" },
                { key: "department", label: "Department" },
            ];

            return headers.map((header) => (
                <div
                    key={header.key}
                    className={`header-cell ${header.key}`}
                    onClick={() => onSort(header.key)}
                    style={{ cursor: "pointer" }}
                >
                    {header.label} {renderSortIcon(header.key)}
                </div>
            ));
        }, [onSort, renderSortIcon]);

        // Render the total header only once
        const totalHeader = useMemo(() => {
            if (!(!isAdmin || (isAdmin && isShowMetrixData))) return null;

            return (
                <div className="header-cell total-attendance-header-cell">
                    <div className="attendance-header-total-title-container">
                        <span>Total</span>
                        <span>Diff</span>
                        <span>Counts</span>
                    </div>
                    <div className="total-data-header">
                        <div className="total-sub-header-cell">Net HR</div>
                        <div className="total-sub-header-cell">OT HR</div>
                        <div className="total-sub-header-cell">Net Diff</div>
                        <div className="total-sub-header-cell">OT Diff</div>
                        <div className="total-sub-header-cell">N Count</div>
                        <div className="total-sub-header-cell">E Count</div>
                        <div className="total-sub-header-cell">Site Count</div>
                        <div className="total-sub-header-cell">
                            Absent Count
                        </div>
                    </div>
                    <div />
                </div>
            );
        }, [isAdmin, isShowMetrixData]);

        return (
            <>
                <div className="header-row" ref={headerRef}>
                    {/* Fixed columns */}
                    <div className="fixed-columns">{fixedColumnHeaders}</div>

                    {/* Scrollable attendance columns */}
                    <div className="scrollable-columns" id="header-scrollable">
                        {filteredColumns.map((attendance, index) => (
                            <div
                                key={`attendance-header-${
                                    attendance.date || index
                                }`}
                                className="header-cell attendance-header-cell"
                                onClick={(e) => handleLockClick(e, attendance)}
                                style={{
                                    cursor: isAdmin ? "pointer" : "default",
                                }}
                            >
                                <div className="attendance-header-date-title-container">
                                    {attendance.date} ({attendance.day})
                                    {attendance.lock_status === "locked" ? (
                                        <LockIcon />
                                    ) : (
                                        <LockOpenIcon />
                                    )}
                                </div>
                                <div className="date-header">
                                    <div className="sub-header-cell">
                                        Net HR
                                    </div>
                                    <div className="sub-header-cell">OT HR</div>
                                    <div className="sub-header-cell">D/E/N</div>
                                </div>
                                <div />
                            </div>
                        ))}
                        {totalHeader}
                    </div>
                </div>

                {/* Popup component - Only render if user is Admin and popup is open */}
                {isAdmin && popupOpen && (
                    <LockUnlockPopup
                        isOpen={popupOpen}
                        onClose={handlePopupClose}
                        onLock={handleLock}
                        onUnlock={handleUnlock}
                        usersRequiringApproval={users}
                        date={selectedDate}
                        position={popupPosition}
                        currentlyLockUnlock={lockUnlock}
                    />
                )}
            </>
        );
    }
);

// Add display name for debugging
AttendanceHeader.displayName = "AttendanceHeader";

export default AttendanceHeader;
