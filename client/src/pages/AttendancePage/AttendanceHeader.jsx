import React, { useState, useRef, useContext } from "react";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockUnlockPopup from "./lockUnlockPopup";
import { AuthContext } from "../../context/AuthContext";
import { useWebSocket } from "../../hooks/useWebSocket";  // Use WebSocket hook

function AttendanceHeader({ columns, onSort, sortConfig }) {
    const { userRole, groupName } = useContext(AuthContext); // Access user role and group from context
    const { ws, send } = useWebSocket();  // WebSocket hook to send messages
    const [popupOpen, setPopupOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [popupPosition, setPopupPosition] = useState({ left: 0 });
    const headerRef = useRef(null);

    const [sampleUsers, setSampleUsers] = useState([
        { name: "John Doe", role: "Manager" },
        { name: "Jane Smith", role: "Team Lead" },
        { name: "Robert Brown", role: "HR Admin" },
        { name: "Emily Davis", role: "Software Engineer" },
        { name: "Michael Johnson", role: "Marketing Specialist" },
        { name: "Sarah Wilson", role: "Financial Analyst" },
        { name: "David Lee", role: "Data Scientist" },
        { name: "Laura Taylor", role: "Product Owner" },
        { name: "James Anderson", role: "UX Designer" },
        { name: "Linda Thomas", role: "DevOps Engineer" }
    ]);

    const renderSortIcon = (key) => {
        if (sortConfig && sortConfig.key === key) {
            return sortConfig.direction === "ascending" ? " ↑" : " ↓";
        }
        return null;
    };

    const handleLockClick = (e, attendance) => {
        e.stopPropagation(); // Prevent event bubbling

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
        setPopupOpen(false);
    };

    const handleLock = () => {
        console.log(`Locking attendance for ${selectedDate}`);
        send("lockAttendance", { date: selectedDate, status: "locked" });
        setPopupOpen(false);
    };

    const handleUnlock = () => {
        console.log(`Unlocking attendance for ${selectedDate}`);
        send("unlockAttendance", { date: selectedDate, status: "unlocked" });
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
                        >
                            <div className="attendance-header-date-title-container">
                                {attendance.date} ({attendance.day})
                                {attendance.isLocked ? <LockIcon /> : <LockOpenIcon />}
                            </div>
                            <div className="date-header">
                                <div className="sub-header-cell">Net HR</div>
                                <div className="sub-header-cell">OT HR</div>
                                <div className="sub-header-cell">D/N</div>
                            </div>
                            <div />
                        </div>
                    ))}
                </div>
            </div>

            {/* Popup component */}
            <LockUnlockPopup 
                isOpen={popupOpen} 
                onClose={handlePopupClose}
                onLock={handleLock}
                onUnlock={handleUnlock}
                usersRequiringApproval={sampleUsers}
                date={selectedDate}
                position={popupPosition}
            />
        </>
    );
}

export default AttendanceHeader;
