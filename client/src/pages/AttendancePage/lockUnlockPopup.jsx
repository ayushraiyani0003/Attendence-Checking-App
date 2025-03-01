import React from "react";
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
    if (!isOpen) return null;

// Calculate popup style based on position
const popupStyle = {
    position: "absolute",
    top: `${position.top}px`, // Position at the bottom edge of the parent (header-row)
    left: `${position.left}px`,
    transform: "translateX(-50%)", // Center the popup on the clicked column
    width: "400px",
    backgroundColor: "white",
    borderRadius: "4px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    zIndex: 1000,
    overflow: "hidden",
    border: "1px solid #ddd",
    marginTop: "1px" // Small margin to separate from the header row
};

    return (
        <div className="attendance-lock-popup" style={popupStyle}>
            <div className="popup-header">
                <h3>{date ? `Attendance Controls - ${date}` : 'Attendance Lock Controls'}</h3>
                <button className="close-button" onClick={onClose}>
                    <CloseIcon />
                </button>
            </div>
            
            <div className="popup-content">
                <div className="approval-info">
                    <h4>Are you sure you want to unlock the attendance for this date?</h4>
                </div>
                
                <div className="action-buttons">
                    <button className="unlock-button" onClick={onUnlock}>
                        <LockOpenIcon /> Unlock
                    </button>
                    <button className="lock-button" onClick={onLock}>
                        <LockIcon /> Lock
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LockUnlockPopup;