import React, { useState, useCallback, useEffect, useMemo } from 'react';
import AttendanceDateRangePicker from './AttendanceDateRangePicker';
import MistakeCounter from '../../components/MistakeCounter/MistakeCounter';

/**
 * Optimized AttendancePageSearchFilters component with debounced search
 */
const AttendancePageSearchFilters = React.memo(({
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
  howMuchMistake
}) => {
  // Local state for input value to implement debouncing
  const [localFilterText, setLocalFilterText] = useState(filterText);
  
  // Debounce the filter text update to reduce lag
  useEffect(() => {
    // Skip initial render
    if (localFilterText === filterText) return;
    
    // Set a timer to update the actual filter after a delay
    const timerId = setTimeout(() => {
      setFilterText(localFilterText);
    }, 300); // 300ms delay - adjust as needed
    
    // Clean up the timer on unmount or before next effect run
    return () => clearTimeout(timerId);
  }, [localFilterText, setFilterText, filterText]);

  // Sync local state with props (when props change externally)
  useEffect(() => {
    if (filterText !== localFilterText) {
      setLocalFilterText(filterText);
    }
  }, [filterText]);
  
  // Memoize handlers to prevent recreating functions on every render
  const handleInputChange = useCallback((e) => {
    setLocalFilterText(e.target.value);
  }, []);
  
  const handleViewChange = useCallback((e) => {
    setView(e.target.value);
  }, [setView]);
  
  const handleMetricsToggle = useCallback(() => {
    setShowMetrics(!showMetrics);
  }, [showMetrics, setShowMetrics]);
  
  const handleDiffToggle = useCallback(() => {
    setShowDiff(!showDiff);
  }, [showDiff, setShowDiff]);
  
  // Memoize the view options to prevent recreation
  const viewOptions = useMemo(() => [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New Emp Only' },
    { value: 'diff', label: 'Diff' },
    { value: 'comment', label: 'Only Comment' },
    { value: 'night', label: 'Only Night' },
    { value: 'evening', label: 'Only Evening' },
    { value: 'site', label: 'Only Site' },
    { value: 'absent', label: 'Only Absent' }
  ], []);
  
  // Memoize toggle switches to prevent recreation on every render
  const metricsToggle = useMemo(() => {
    if (!isAdmin) return null;
    
    return (
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
            onChange={handleMetricsToggle}
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
    );
  }, [isAdmin, showMetrics, handleMetricsToggle]);
  
  const diffToggle = useMemo(() => {
    if (!isAdmin) return null;
    
    return (
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
            onChange={handleDiffToggle}
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
    );
  }, [isAdmin, showDiff, handleDiffToggle]);
  
  // Memoize save button to prevent recreation on every render
  const saveButton = useMemo(() => {
    if (!hasChanges) return null;
    
    return (
      <button
        className="control-button secondary"
        onClick={handleSaveChanges}
      >
        Save Changes
      </button>
    );
  }, [hasChanges, handleSaveChanges]);
  
  return (
    <div>
      <div className="attendance-controls">
        <div>
          <input
            type="text"
            placeholder="Search across all fields..."
            value={localFilterText}
            onChange={handleInputChange}
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
            onChange={handleViewChange}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid var(--gray-300)",
              background: "white",
              marginRight: "12px",
            }}
          >
            {viewOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <MistakeCounter totalMistakes={howMuchMistake} />
        </div>
        <div className="button-group" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {isAdmin && (
            <>
              {metricsToggle}
              {diffToggle}
            </>
          )}
          
          <AttendanceDateRangePicker
  dateRange={dateRange}
  setDateRange={setDateRange}
/>
          {saveButton}
        </div>
      </div>
    </div>
  );
});

// Add display name for debugging
AttendancePageSearchFilters.displayName = 'AttendancePageSearchFilters';

export default AttendancePageSearchFilters;