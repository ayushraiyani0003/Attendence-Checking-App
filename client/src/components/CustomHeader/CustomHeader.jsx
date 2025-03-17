import React, { useState, useRef, useEffect } from "react";
import "./CustomHeader.css";

const CustomDropdown = ({ options, defaultValue, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(defaultValue || options[0]);
  const dropdownRef = useRef(null);
  const optionsContainerRef = useRef(null);
  const selectedOptionRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll to center the selected option when dropdown opens
  useEffect(() => {
    if (isOpen && optionsContainerRef.current && selectedOptionRef.current) {
      const container = optionsContainerRef.current;
      const selectedElement = selectedOptionRef.current;
      
      // Calculate the position to center the selected option
      const containerHeight = container.offsetHeight;
      const selectedHeight = selectedElement.offsetHeight;
      const selectedTop = selectedElement.offsetTop;
      
      // Scroll position to center the selected item
      const scrollPosition = selectedTop - (containerHeight / 2) + (selectedHeight / 2);
      
      container.scrollTop = scrollPosition;
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
    if (onChange) onChange(option);
  };

  return (
    <div className="custom-dropdown-container" ref={dropdownRef}>
      <div
        className={`custom-dropdown-selected ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption}</span>
        <svg
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          width="12"
          height="7"
          viewBox="0 0 12 7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {isOpen && (
        <div className="custom-dropdown-options" ref={optionsContainerRef}>
          {options.map((option, index) => (
            <div
              key={index}
              ref={selectedOption === option ? selectedOptionRef : null}
              className={`custom-dropdown-option ${selectedOption === option ? 'selected' : ''}`}
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

// Updated CustomHeader component with current month centered
function CustomHeader({ toggleSidebar, user }) {
  // Function to generate date list
  function generateDateList(startDate, endYear) {
    const dateOptions = [];
    const [startMonth, startYear] = startDate.split(" ");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let currentYear = parseInt(startYear);
    let currentMonthIndex = months.indexOf(startMonth);
    
    while (currentYear <= endYear) {
      dateOptions.push(`${months[currentMonthIndex]} ${currentYear}`);
      // Move to the next month
      currentMonthIndex++;
      if (currentMonthIndex >= months.length) {
        currentMonthIndex = 0;
        currentYear++;
      }
    }
    return dateOptions;
  }

  // Get current month and year
  const getCurrentMonthYear = () => {
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  const dateOptions = generateDateList("Dec 2024", 2030);
  const currentMonthYear = getCurrentMonthYear();
  
  // Find the closest option to current month/year
  const defaultValue = dateOptions.includes(currentMonthYear) 
    ? currentMonthYear 
    : dateOptions[0];

  return (
    <header className="custom-header">
      <div className="header-left">
        <div className="hamburger-menu" onClick={toggleSidebar}>
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </div>
        <input type="text" className="search-box" placeholder="sunchaser / HR" />
      </div>
      <div className="header-right">
        <CustomDropdown 
          options={dateOptions} 
          defaultValue={defaultValue} 
          onChange={(selected) => console.log("Selected:", selected)} 
        />
        <div className="profile-info">
          <div className="name-designation">
            <p className="header-name">{user.name}</p>
            <p className="header-designation">{user.role}</p>
          </div>
          <img
            src="https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D"
            alt="profile"
            className="profile-img"
          />
        </div>
      </div>
    </header>
  );
}

export default CustomHeader;