import React, { useState, useRef, useEffect } from "react";
import "./CustomHeader.css";

// Updated CustomHeader component with month-year picker styled like a dropdown
function CustomHeader({ toggleSidebar, user }) {
  const [selectedDate, setSelectedDate] = useState("2024-12");

  const handleMonthYearChange = (event) => {
    setSelectedDate(event.target.value);
    console.log("Selected Month-Year:", event.target.value);
  };

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
        {/* Month-Year Picker styled like a dropdown */}
        <div className="custom-month-year-dropdown">
          <input 
            type="month" 
            value={selectedDate} 
            onChange={handleMonthYearChange} 
            className="month-year-picker"
          />
        </div>
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
