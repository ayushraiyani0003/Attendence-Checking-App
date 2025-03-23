import React from 'react'

function AttendencePageSearchFilters({ filterText,
    setFilterText,
    view,
    setView,
    downloadReport,
    hasChanges,
    handleSaveChanges,
    isAdmin }) {
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
      <div className="button-group" style={{ display: "flex", gap: "12px" }}>
        {isAdmin && (
          <>
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