import React, { useState, useRef, useContext } from "react";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockUnlockPopup from "./lockUnlockPopup";
import { AuthContext } from "../../context/AuthContext";
import { useWebSocket } from "../../hooks/useWebSocket";  // Use WebSocket hook
import { useUsers } from "../../hooks/userList";

function AttendanceHeader({ columns, onSort, sortConfig, handleLock, handleUnlock, popupOpen, setPopupOpen }) {
    const { userRole, groupName } = useContext(AuthContext); // Access user role and group from context
    const { ws, send } = useWebSocket();  // WebSocket hook to send messages
    const { users } = useUsers();  // Fetch reporting groups using the useSettings hook
    const [selectedDate, setSelectedDate] = useState(null);
    const [popupPosition, setPopupPosition] = useState({ left: 0 });
    const headerRef = useRef(null);
    
    // Check if user is an admin
    const isAdmin = userRole === "admin";

    const renderSortIcon = (key) => {
        if (sortConfig && sortConfig.key === key) {
            return sortConfig.direction === "ascending" ? " ↑" : " ↓";
        }
        return null;
    };

    const handleLockClick = (e, attendance) => {
        e.stopPropagation(); // Prevent event bubbling
        
        // Only proceed if user is Admin
        if (!isAdmin) return;

        // Calculate position of the popup
        const columnElement = e.currentTarget;
        const columnRect = columnElement.getBoundingClientRect();
        const headerRect = headerRef.current.getBoundingClientRect();

        // Position popup at the center of the clicked column
        const leftPosition = columnRect.left + (columnRect.width / 2);

        setPopupPosition({ left: leftPosition });
        setSelectedDate(attendance.date);
        setPopupOpen(true);
    };

    const handlePopupClose = () => {
        // Only proceed if user is Admin
        if (!isAdmin) return;
        
        setPopupOpen(false);
    };


    return (
        <>
            <div className="header-row" ref={headerRef}>
                {/* Fixed columns */}
                <div className="fixed-columns">
                    <div
                        className="header-cell punch-code"
                        onClick={() => onSort("punchCode")}
                        style={{ cursor: "pointer" }}
                    >
                        Punch Code {renderSortIcon("punchCode")}
                    </div>
                    <div
                        className="header-cell name"
                        onClick={() => onSort("name")}
                        style={{ cursor: "pointer" }}
                    >
                        Name {renderSortIcon("name")}
                    </div>
                    <div
                        className="header-cell designation"
                        onClick={() => onSort("designation")}
                        style={{ cursor: "pointer" }}
                    >
                        Designation {renderSortIcon("designation")}
                    </div>
                    <div
                        className="header-cell department"
                        onClick={() => onSort("department")}
                        style={{ cursor: "pointer" }}
                    >
                        Department {renderSortIcon("department")}
                    </div>
                </div>

                {/* Scrollable attendance columns */}
                <div className="scrollable-columns" id="header-scrollable">
                    {columns.map((attendance, index) => (
                        <div 
                            key={index} 
                            className="header-cell attendance-header-cell"
                            onClick={(e) => handleLockClick(e, attendance)}
                            style={{ cursor: isAdmin ? "pointer" : "default" }}
                        >
                            <div className="attendance-header-date-title-container">
                                {attendance.date} ({attendance.day})
                                {attendance.isLocked ? <LockIcon /> : <LockOpenIcon />}
                            </div>
                            <div className="date-header">
                                <div className="sub-header-cell">Net HR</div>
                                <div className="sub-header-cell">OT HR</div>
                                <div className="sub-header-cell">D/A/N</div>
                            </div>
                            <div />
                        </div>
                    ))}
                    <div 
                            key={99999} 
                            className="header-cell total-attendance-header-cell"
                        >
                            <div className="attendance-header-date-title-container">
                                Total
                            </div>
                            <div className="total-data-header">
                                <div className="total-sub-header-cell">Net HR</div>
                                <div className="total-sub-header-cell">OT HR</div>
                                <div className="total-sub-header-cell">N Count</div>
                                <div className="total-sub-header-cell">Metrix Diff</div>
                                <div className="total-sub-header-cell">extra</div>
                            </div>
                            <div />
                        </div>
                </div>
            </div>

            {/* Popup component - Only render if user is Admin */}
            {isAdmin && (
                <LockUnlockPopup 
                    isOpen={popupOpen} 
                    onClose={handlePopupClose}
                    onLock={handleLock}
                    onUnlock={handleUnlock}
                    usersRequiringApproval={users}
                    date={selectedDate}
                    position={popupPosition}
                />
            )}
        </>
    );
}

export default AttendanceHeader;