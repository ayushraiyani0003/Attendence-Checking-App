import React from 'react'

function AttendencePageSearchFilters({ 
  filterText,
  setFilterText,
  view,
  setView,
  downloadReport,
  hasChanges,
  handleSaveChanges,
  isAdmin,
  showMetrics,
  setShowMetrics 
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
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid var(--gray-300)",
              background: "white",
            }}
          >
            <option value="all">All Shifts</option>
            <option value="day">Day Shift</option>
            <option value="night">Night Shift</option>
          </select>
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
              <button
                className="control-button secondary"
                onClick={downloadReport}
              >
                Download Report
              </button>
            </>
          )}
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
  )
}

export default AttendencePageSearchFilters