import React, { useEffect, useRef } from 'react';
import './AttendancePage.css';

function AttendanceHeader({ columns, onSort, sortConfig }) {
  const renderSortIcon = (key) => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    }
    return null;
  };

  document.addEventListener('DOMContentLoaded', function() {
    const dataContainer = document.querySelector('.data-container');
    const headerScrollable = document.querySelector('.header-scroll-wrapper');
    
    if (dataContainer && headerScrollable) {
      dataContainer.addEventListener('scroll', function() {
        headerScrollable.scrollLeft = this.scrollLeft;
      });
    }
  });


  return (
    <div className="header-wrapper">
      <div className="header-row">
        {/* Fixed columns */}
        <div className="fixed-columns">
          <div
            className="header-cell punch-code"
            onClick={() => onSort('punchCode')}
            style={{ cursor: 'pointer' }}
          >
            Punch Code {renderSortIcon('punchCode')}
          </div>
          <div
            className="header-cell name"
            onClick={() => onSort('name')}
            style={{ cursor: 'pointer' }}
          >
            Name {renderSortIcon('name')}
          </div>
          <div
            className="header-cell designation"
            onClick={() => onSort('designation')}
            style={{ cursor: 'pointer' }}
          >
            Designation {renderSortIcon('designation')}
          </div>
          <div
            className="header-cell department"
            onClick={() => onSort('department')}
            style={{ cursor: 'pointer' }}
          >
            Department {renderSortIcon('department')}
          </div>
        </div>
        {/* Scrollable attendance columns */}
        <div className="scrollable-columns" id="header-scrollable">
          {columns.map((attendance, index) => (
            <div key={index} className="header-cell attendance-header-cell">
              {attendance.date} ({attendance.day})
              <div className="date-header">
                <div className="sub-header-cell">Net HR</div>
                <div className="sub-header-cell">OT HR</div>
                <div className="sub-header-cell">D/N</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AttendanceHeader;