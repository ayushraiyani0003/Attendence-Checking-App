import React from 'react';
import './ChangesHeader.css';

const ChangesHeader = ({ 
  title, 
  selectedDate, 
  onDateChange, 
  searchTerm, 
  onSearchChange,
  departments = [],
  reportingGroups = [],
  filterDepartment,
  onDepartmentFilterChange,
  filterReportingGroup,
  onReportingGroupFilterChange
}) => {
  return (
    <div className="changes-header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
      </div>
      <div className="header-right">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={onSearchChange}
            className="search-input"
          />
          <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        
        <div className="filter-container">
          {/* Department filter */}
          <select 
            value={filterDepartment}
            onChange={onDepartmentFilterChange}
            className="filter-select"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          
          {/* Reporting Group filter */}
          <select 
            value={filterReportingGroup}
            onChange={onReportingGroupFilterChange}
            className="filter-select"
          >
            <option value="all">All Reporting Groups</option>
            {reportingGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
        
        <div className="date-container">
          <input
            type="date"
            value={selectedDate}
            onChange={onDateChange}
            className="date-input"
          />
          <svg className="calendar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ChangesHeader;