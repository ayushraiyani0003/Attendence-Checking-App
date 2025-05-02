import React, { useState, useRef, useEffect } from "react";
import NewsTicker from "./newsTicker";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/sunchaser.png";
import "./CustomHeader.css";
import { useHeaderNotificationClient } from "../../hooks/useNotification";

// Modified CustomDropdown component
const CustomDropdown = ({ options, defaultValue, onChange, value }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState(
        value || defaultValue || options[0]
    );
    const dropdownRef = useRef(null);
    const optionsContainerRef = useRef(null);
    const selectedOptionRef = useRef(null);

    // Update selected option when value prop changes
    useEffect(() => {
        if (value && options.includes(value)) {
            setSelectedOption(value);
        }
    }, [value, options]);

    // Update when defaultValue changes
    useEffect(() => {
        if (defaultValue && options.includes(defaultValue) && !value) {
            setSelectedOption(defaultValue);
        }
    }, [defaultValue, options, value]);

    // Handle clicks outside the dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Scroll to selected option when dropdown opens
    useEffect(() => {
        if (
            isOpen &&
            optionsContainerRef.current &&
            selectedOptionRef.current
        ) {
            const container = optionsContainerRef.current;
            const selectedElement = selectedOptionRef.current;
            const containerHeight = container.offsetHeight;
            const selectedHeight = selectedElement.offsetHeight;
            const selectedTop = selectedElement.offsetTop;
            const scrollPosition =
                selectedTop - containerHeight / 2 + selectedHeight / 2;
            container.scrollTop = scrollPosition;
        }
    }, [isOpen]);

    const handleSelect = (option) => {
        console.log("Selected option:", option); // For debugging
        setSelectedOption(option);
        setIsOpen(false);
        if (onChange) onChange(option);
    };

    return (
        <div className="custom-dropdown-container" ref={dropdownRef}>
            <div
                className={`custom-dropdown-selected ${isOpen ? "active" : ""}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{selectedOption}</span>
                <svg
                    className={`dropdown-arrow ${isOpen ? "open" : ""}`}
                    width="12"
                    height="7"
                    viewBox="0 0 12 7"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M1 1L6 6L11 1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            {isOpen && (
                <div
                    className="custom-dropdown-options"
                    ref={optionsContainerRef}
                >
                    {options.map((option, index) => (
                        <div
                            key={index}
                            ref={
                                selectedOption === option
                                    ? selectedOptionRef
                                    : null
                            }
                            className={`custom-dropdown-option ${
                                selectedOption === option ? "selected" : ""
                            }`}
                            onClick={() => handleSelect(option)}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
function CustomHeader({
    toggleSidebar,
    user,
    onSearch,
    onMonthChange,
    onGroupChange,
}) {
    const {
        hasMessages,
        currentMessage,
        visible,
        dismissBanner,
        totalMessages,
    } = useHeaderNotificationClient();

    // Define the "All Groups" constant
    const ALL_GROUPS = "All Groups";
    
    // For the reporting group dropdown
    const [userGroups, setUserGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');

    // State for selected month
    const [selectedMonth, setSelectedMonth] = useState('');
    
    // Debug log to track state changes
    useEffect(() => {
        console.log("selectedMonth changed:", selectedMonth);
    }, [selectedMonth]);

    // Add a listener for the custom reportingGroupChanged event
    useEffect(() => {
        const handleReportingGroupChange = (event) => {
            const newGroup = event.detail.group;
            if (newGroup && (userGroups.includes(newGroup) || newGroup === ALL_GROUPS)) {
                setSelectedGroup(newGroup);
                console.log("Header updated with new group:", newGroup);
            }
        };
        
        window.addEventListener('reportingGroupChanged', handleReportingGroupChange);
        
        return () => {
            window.removeEventListener('reportingGroupChanged', handleReportingGroupChange);
        };
    }, [userGroups]);

    useEffect(() => {
        // Convert user.userReportingGroup to an array if it exists
        if (user && user.userReportingGroup) {
            // If it's already an array, use it; if it's a single value, make it an array
            const originalGroups = Array.isArray(user.userReportingGroup)
                ? user.userReportingGroup
                : [user.userReportingGroup];
            
            // Add "All Groups" option at the beginning for admin users
            const groupsWithAll = [ALL_GROUPS, ...originalGroups];
            
            setUserGroups(groupsWithAll);
            
            // Initialize selected group if not set yet
            // Set the first actual group (index 1) as default, not "All Groups"
            if (!selectedGroup && originalGroups.length > 0) {
                // Use the first actual reporting group as the default
                setSelectedGroup(originalGroups[0]);
                
                // Also notify the parent component about this initial selection
                if (onGroupChange) {
                    onGroupChange(originalGroups[0]);
                }
            }
        }
    }, [user, selectedGroup, onGroupChange]);

    function generateDateList(startDate, endYear) {
        const dateOptions = [];
        const [startMonth, startYear] = startDate.split(" ");
        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];
        let currentYear = parseInt(startYear);
        let currentMonthIndex = months.indexOf(startMonth);

        while (currentYear <= endYear) {
            dateOptions.push(`${months[currentMonthIndex]} ${currentYear}`);
            currentMonthIndex++;
            if (currentMonthIndex >= months.length) {
                currentMonthIndex = 0;
                currentYear++;
            }
        }
        return dateOptions;
    }

    const getPreviousMonthYear = () => {
        const now = new Date();
        const dayOfMonth = now.getDate();
        
        // If we're on the 1st day of the month, select the previous month
        // Otherwise, select the current month
        const targetDate = dayOfMonth === 1 
            ? new Date(now.getFullYear(), now.getMonth() - 1, 1) // Previous month if it's the 1st
            : new Date(now.getFullYear(), now.getMonth(), 1);     // Current month otherwise
        
        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        
        return `${months[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
    };

    const dateOptions = generateDateList("Dec 2024", 2030);
    const previousMonthYear = getPreviousMonthYear();

    // Set default month only once when component mounts
    useEffect(() => {
        const initialMonth = previousMonthYear;
        console.log("Setting initial month:", initialMonth);
        
        if (!selectedMonth && dateOptions.includes(initialMonth)) {
            setSelectedMonth(initialMonth);
            if (onMonthChange) onMonthChange(initialMonth);
        }
    }, []); // Empty dependency array to run only once

    const [searchText, setSearchText] = useState("");

    const handleSearchChange = (event) => {
        setSearchText(event.target.value);
        if (onSearch) onSearch(event.target.value);
    };

    const handleMonthChange = (selected) => {
        console.log("Month change handler called with:", selected);
        setSelectedMonth(selected);
        if (onMonthChange) onMonthChange(selected);
    };

    const handleGroupChange = (selected) => {
        setSelectedGroup(selected); // Update local state
        if (onGroupChange) onGroupChange(selected);
    };

    const navigate = useNavigate();

    return (
        <header className="custom-header">
            <div className="header-left">
                <div className="hamburger-menu" onClick={toggleSidebar}>
                    <div className="line"></div>
                    <div className="line"></div>
                    <div className="line"></div>
                </div>
                <h2>
                    <img style={{cursor: "pointer"}} src={logo} alt="Logo" className="header-logo" onClick={() => navigate("/")}/>
                </h2>
                {visible && hasMessages && currentMessage ? (
                    <NewsTicker messages={currentMessage.message} speed={50} />
                ) : (
                    <NewsTicker messages="" speed={50} />
                )}
            </div>
            <div className="header-right">
                {userGroups.length > 0 && user.role === "admin" && (
                    <div className="group-dropdown-container">
                        <CustomDropdown
                            options={userGroups}
                            defaultValue={userGroups.length > 1 ? userGroups[1] : userGroups[0]} 
                            value={selectedGroup}
                            onChange={handleGroupChange}
                        />
                    </div>
                )}
                <CustomDropdown
                    options={dateOptions}
                    defaultValue={previousMonthYear}
                    value={selectedMonth}
                    onChange={handleMonthChange}
                />
                <div className="profile-info">
                    <div className="name-designation">
                        <p className="header-name">{user.name}</p>
                        <p className="header-designation">{user.role}</p>
                    </div>
                    <img
                        src="https://media-bom2-1.cdn.whatsapp.net/v/t61.24694-24/328755532_816324683940176_6907086445960651734_n.jpg?ccb=11-4&oh=01_Q5Aa1QGZRyeP6XW9mIBPkRWAXsYX2V2rSdJ5QfyOgO-FYi_ZJA&oe=68200014&_nc_sid=5e03e0&_nc_cat=102"
                        alt="profile"
                        className="profile-img"
                    />
                </div>
            </div>
        </header>
    );
}

export default CustomHeader;