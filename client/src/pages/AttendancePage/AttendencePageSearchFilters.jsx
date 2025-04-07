
// AttendencePageSearchFilters.jsx
import React, { useEffect } from 'react';
import SimplifiedDatePicker from './CustomDatePicker';
import ColumnVisibilityControl from './ColumnVisibilityControl';

function AttendencePageSearchFilters({
  filterText,
  setFilterText,
  view,
  setView,
  hasChanges,
  handleSaveChanges,
  isAdmin,
  showMetrics,
  showDiff,
  setShowMetrics,
  setShowDiff,
  dateRange, 
  setDateRange,
  columns, 
  onToggleColumn
}) {
  return (
    <div>
      <div className="attendance-controls">
        <div>
          <input
            type="text"
            placeholder="Search across all fields..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="attendencepage-search-input"
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid var(--gray-300)",
              marginRight: "12px",
              width: "240px",
            }}
          />
          {isAdmin ? <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid var(--gray-300)",
              background: "white",
            }}
          >
            <option value="all">All</option>
            <option value="new">New Emp Only</option>
            <option value="diff">Diff</option>
            <option value="comment">Only Comment</option>
            <option value="night">Only Night</option>
            <option value="evening">Only Evening</option>
            <option value="site">Only Site</option>
            <option value="absent">Only Absent</option>
          </select>
            : null}
        </div>
        <div className="button-group" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {isAdmin && (
            <>
              <div className="metrics-toggle" style={{ display: "flex", alignItems: "center", marginRight: "12px" }}>
                <span style={{ marginRight: "8px" }}>
                  {showMetrics ? "Hide Metrics" : "Show Metrics"}
                </span>
                <label
                  className="toggle-switch"
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "40px",
                    height: "20px",
                    cursor: "pointer"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showMetrics}
                    onChange={() => setShowMetrics(!showMetrics)}
                    style={{
                      opacity: 0,
                      width: 0,
                      height: 0
                    }}
                  />
                  <span
                    className="slider"
                    style={{
                      position: "absolute",
                      cursor: "pointer",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: showMetrics ? "#4a90e2" : "#ccc",
                      transition: "0.4s",
                      borderRadius: "34px"
                    }}
                  >
                    <span
                      className="slider-button"
                      style={{
                        position: "absolute",
                        content: '""',
                        height: "16px",
                        width: "16px",
                        left: showMetrics ? "20px" : "4px",
                        bottom: "2px",
                        backgroundColor: "white",
                        transition: "0.4s",
                        borderRadius: "50%"
                      }}
                    />
                  </span>
                </label>
              </div>
              <div className="metrics-toggle" style={{ display: "flex", alignItems: "center", marginRight: "12px" }}>
                <span style={{ marginRight: "8px" }}>
                  {showDiff ? "Hide Diff" : "Show Diff"}
                </span>
                <label
                  className="toggle-switch"
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "40px",
                    height: "20px",
                    cursor: "pointer"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showDiff}
                    onChange={() => setShowDiff(!showDiff)}
                    style={{
                      opacity: 0,
                      width: 0,
                      height: 0
                    }}
                  />
                  <span
                    className="slider"
                    style={{
                      position: "absolute",
                      cursor: "pointer",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: showDiff ? "#4a90e2" : "#ccc",
                      transition: "0.4s",
                      borderRadius: "34px"
                    }}
                  >
                    <span
                      className="slider-button"
                      style={{
                        position: "absolute",
                        content: '""',
                        height: "16px",
                        width: "16px",
                        left: showDiff ? "20px" : "4px",
                        bottom: "2px",
                        backgroundColor: "white",
                        transition: "0.4s",
                        borderRadius: "50%"
                      }}
                    />
                  </span>
                </label>
              </div>
            </>
          )}
          {/* <ColumnVisibilityControl  
  columns={columns}
  onToggleColumn={onToggleColumn}
          /> */}
          <SimplifiedDatePicker
          dateRange={dateRange}
          setDateRange={setDateRange}
          />
          {/* Save Changes Button */}
          {hasChanges && (
            <button
              className="control-button secondary"
              onClick={handleSaveChanges}
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AttendencePageSearchFilters;