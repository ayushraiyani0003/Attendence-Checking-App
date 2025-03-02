import React, { useState, useRef, useEffect } from "react";
import "./CustomHeader.css";

const CustomDropdown = ({ options, defaultValue, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(defaultValue || options[0]);
  const dropdownRef = useRef(null);

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
        <div className="custom-dropdown-options">
          {options.map((option, index) => (
            <div 
              key={index} 
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

// Updated CustomHeader component
function CustomHeader({ toggleSidebar, user }) {
  const dateOptions = ["Dec 2024", "Jan 2025", "Feb 2025", "Mar 2025"];
  
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
          defaultValue="Dec 2024" 
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
