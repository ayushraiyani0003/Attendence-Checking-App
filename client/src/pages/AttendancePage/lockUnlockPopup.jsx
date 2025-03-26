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
    position
}) {
    const [selectedUser, setSelectedUser] = useState(null);
    const popupRef = useRef(null);  // Ref to the popup container

    // Add the event listener when the popup is open
    useEffect(() => {
        if (!isOpen) return;  // If popup is closed, no need to add event listener

        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                onClose();
            }
        };

        // Add event listener
        document.addEventListener("mousedown", handleClickOutside);

        // Clean up the event listener when the component is unmounted or when `isOpen` changes
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);  // Dependencies are `isOpen` and `onClose`

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
        overflow: "visible", // Changed from "hidden" to allow dropdown to extend outside
        border: "1px solid #ddd",
        marginTop: "1px",
        padding: "20px",
    };

    // Prepare options for the dropdown
    const userOptions = usersRequiringApproval.map(user => ({
        value: user.reporting_group,
        label: `${user.name} - ${user.user_role} -- ${user.reporting_group}`
    }));

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
            zIndex: 1500, // Higher z-index to ensure it's above other elements
        }),
        menuList: (base) => ({
            ...base,
            maxHeight: "150px", // Specific height for the dropdown list
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
        // Make sure dropdown portal has correct z-index
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
