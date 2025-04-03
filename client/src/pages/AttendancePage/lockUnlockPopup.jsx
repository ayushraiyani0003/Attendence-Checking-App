import React, { useState, useEffect, useRef } from "react";
import CloseIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import Select from 'react-select';

function LockUnlockPopup({
    isOpen,
    onClose,
    onLock,
    onUnlock,
    usersRequiringApproval,
    date,
    position,
    currentlyLockUnlock,
}) {
    const [selectedUser, setSelectedUser] = useState(null);
    const popupRef = useRef(null);

    // Reset selectedUser when popup opens
    useEffect(() => {
        if (isOpen) {
            setSelectedUser(null);
        }
    }, [isOpen]);

    console.log(currentlyLockUnlock);


    // Add the event listener when the popup is open
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                onClose();
            }
        };

        // Add event listener
        document.addEventListener("mousedown", handleClickOutside);

        // Clean up the event listener
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Calculate popup style based on position
    const popupStyle = {
        position: "absolute",
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
        width: "400px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        zIndex: 1000,
        overflow: "visible",
        border: "1px solid #ddd",
        marginTop: "1px",
        padding: "20px",
    };
    // In your LockUnlockPopup component, add this function to format the date
    const formatDate = (dateString) => {
        // If the date is in format DD/MM/YYYY (like "29/3/2025")
        if (dateString.includes('/')) {
            const [day, month, year] = dateString.split('/');
            // Format to YYYY-MM-DD (pad the month and day with leading zeros if needed)
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        // If it's already in YYYY-MM-DD format, return as is
        return dateString;
    };

    // Filter out admin users and prepare options for the dropdown
// Inside your map function where you create user options
const userOptions = usersRequiringApproval
    .filter(user => user.user_role !== 'admin') // Filter out admin users
    .map(user => {
        // Format the date before comparing
        const formattedSelectedDate = formatDate(date);
        
        // Handle multi-group users without changing the return structure
        const userGroups = Array.isArray(user.reporting_group) 
            ? user.reporting_group 
            : [user.reporting_group];
        
        // Check if ANY group is unlocked (we want green if any group is unlocked)
        const isLocked = userGroups.every(group => {
            return currentlyLockUnlock.some(item => {
                // Normalize strings for comparison (lowercase both values)
                const normalizedItemGroup = String(item.reporting_group).toLowerCase();
                const normalizedUserGroup = String(group).toLowerCase();
                
                // Return true if this specific group is locked
                return item.date === formattedSelectedDate && 
                    normalizedItemGroup === normalizedUserGroup &&
                    item.status === "locked";
            });
        });
        
        console.log(user);
        console.log("formattedSelectedDate: " + formattedSelectedDate);
        
        // For display, join multiple groups with commas
        const displayGroups = Array.isArray(user.reporting_group) 
            ? user.reporting_group.join(', ') 
            : user.reporting_group;
        
        return {
            value: user.reporting_group, // Keep original value structure
            label: `${user.name} - ${displayGroups} ${isLocked ? '🔴' : '🟢'}`,
            isLocked: isLocked
        };
    });


    const handleUserChange = (selectedOption) => {
        setSelectedUser(selectedOption);
    };

    // Custom styles for the Select component
    const customStyles = {
        control: (base) => ({
            ...base,
            borderRadius: "4px",
            borderColor: "#ddd",
            boxShadow: "none",
            "&:hover": {
                borderColor: "#aaa",
            },
            minHeight: "40px",
        }),
        menu: (base) => ({
            ...base,
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            marginTop: "4px",
            zIndex: 1500,
        }),
        menuList: (base) => ({
            ...base,
            maxHeight: "150px",
            paddingTop: "5px",
            paddingBottom: "5px",
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? "#2684FF" : state.isFocused ? "#f0f0f0" : null,
            color: state.isSelected ? "white" : "#333",
            padding: "8px 12px",
        }),
        placeholder: (base) => ({
            ...base,
            color: "#999",
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 1500,
        }),
    };

    return (
        <div className="attendance-lock-popup" style={popupStyle} ref={popupRef}>
            <div className="popup-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>{date ? `Attendance Controls - ${date}` : 'Attendance Lock Controls'}</h3>
                <button className="close-button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <CloseIcon />
                </button>
            </div>

            <div className="popup-content" style={{ marginTop: "15px" }}>
                <div className="approval-info" style={{ marginBottom: "20px" }}>
                    <h4 style={{ marginBottom: "10px" }}>Are you sure you want to lock/unlock the attendance for this date?</h4>
                </div>
                {/* User selection dropdown */}
                <div className="user-selection" style={{ marginBottom: "20px" }}>
                    <Select
                        options={userOptions}
                        placeholder="Select user"
                        styles={customStyles}
                        isSearchable={true}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        value={selectedUser}
                        onChange={handleUserChange}
                        classNamePrefix="select"
                        className="user-select"
                    />
                </div>

                <p style={{ fontSize: "14px", color: "#666" }}>Please select the user who will approve this action.</p>

                <div className="action-buttons" style={{ display: "flex", justifyContent: "space-between" }}>
                    <button
                        className="unlock-button"
                        onClick={() => onUnlock(selectedUser?.value, date)}
                        disabled={!selectedUser}
                        style={{
                            padding: "10px 15px",
                            borderRadius: "5px",
                            backgroundColor: selectedUser ? "#4CAF50" : "#a5d6a7",
                            color: "white",
                            border: "none",
                            cursor: selectedUser ? "pointer" : "not-allowed",
                            fontSize: "16px",
                        }}
                    >
                        <LockOpenIcon style={{ marginRight: "8px" }} /> Unlock
                    </button>
                    <button
                        className="lock-button"
                        onClick={() => onLock(selectedUser?.value, date)}
                        disabled={!selectedUser}
                        style={{
                            padding: "10px 15px",
                            borderRadius: "5px",
                            backgroundColor: selectedUser ? "#F44336" : "#ef9a9a",
                            color: "white",
                            border: "none",
                            cursor: selectedUser ? "pointer" : "not-allowed",
                            fontSize: "16px",
                        }}
                    >
                        <LockIcon style={{ marginRight: "8px" }} /> Lock
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LockUnlockPopup;