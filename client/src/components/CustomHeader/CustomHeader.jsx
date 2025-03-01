import React from "react";
import "./CustomHeader.css";

function CustomHeader({ toggleSidebar }) {
  return (
    <header className="custom-header">
      <div className="header-left">
        {/* Sidebar Toggle Button */}
        <div className="hamburger-menu" onClick={toggleSidebar}>
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </div>
        <input type="text" className="search-box" placeholder="sunchaser / HR" />
      </div>
      <div className="header-right">
        <select className="date-dropdown">
          <option>Dec 2024</option>
          <option>Jan 2025</option>
        </select>
        <div className="profile-info">
          <div className="name-designation">
            <p className="header-name">John Doe</p>
            <p className="header-designation">Software Engineer</p>
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
