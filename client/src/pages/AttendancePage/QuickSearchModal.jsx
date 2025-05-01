// components/AttendancePage/QuickSearchModal.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Users, Briefcase } from "lucide-react";
import { useEmployeeContext } from "../../context/EmployeeContext";
import "./QuickSearchModal.css";

// Define the "All Groups" constant - keep it the same as in CustomHeader
const ALL_GROUPS = "All Groups";

const QuickSearchModal = ({ 
  isOpen, 
  onClose, 
  onSelect,
  setFilterText,
  selectedGroup, // Added to know the current selected group
  placeholder = "Search by punch code, name, reporting group..."
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchMode, setSearchMode] = useState("employee"); // "employee" or "reportingGroup"
  const searchInputRef = useRef(null);
  const resultsContainerRef = useRef(null);
  
  // Get employees from context
  const { employees, loading, fetchEmployeesData } = useEmployeeContext();
  
  // Fetch employees when modal opens if not already loaded
  useEffect(() => {
    if (isOpen && !loading && employees.length === 0) {
      fetchEmployeesData();
    }
  }, [isOpen, loading, employees.length, fetchEmployeesData]);
  
  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedIndex(0);
      setSearchMode("employee");
      // Focus with a small delay to ensure the modal is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Add global keyboard listener for Alt+Shift+S and Alt+Shift+F
  useEffect(() => {
    const handleKeyboardShortcut = (e) => {
      // Check for Alt+Shift+S or Alt+Shift+F
      if (e.altKey && e.shiftKey && (e.key === 's' || e.key === 'S' || e.key === 'f' || e.key === 'F')) {
        // Prevent default browser actions
        e.preventDefault();
        
        // Open the modal if it's closed
        if (!isOpen) {
          // We can't directly call setIsOpen since it's not in this component's state
          // Instead, dispatch a custom event that the parent component can listen for
          const openEvent = new CustomEvent("openQuickSearch");
          window.dispatchEvent(openEvent);
        }
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyboardShortcut);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, [isOpen]);

  // Check if searchTerm starts with reporting group prefix
  const isReportingGroupSearch = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return term.startsWith("rep") || 
           term.startsWith("r.") || 
           term.startsWith("re") || 
           term.startsWith("grp") || 
           term.startsWith("g.");
  }, [searchTerm]);

  // Update search mode based on prefixes
  useEffect(() => {
    if (isReportingGroupSearch) {
      setSearchMode("reportingGroup");
    } else {
      setSearchMode("employee");
    }
  }, [isReportingGroupSearch]);

  // Transform employee data to searchable format
  const searchData = useMemo(() => {
    return employees.map(emp => ({
      id: emp.employee_id,
      name: emp.name || "",
      punchCode: emp.punch_code || "",
      reportingGroup: emp.reporting_group || "",
    }));
  }, [employees]);

  // Get the actual search term (remove prefix if in special mode)
  const getActualSearchTerm = () => {
    const term = searchTerm.trim().toLowerCase();
    
    if (searchMode === "reportingGroup") {
      if (term.startsWith("rep.")) return term.substring(4);
      if (term.startsWith("reporting.")) return term.substring(10);
      if (term.startsWith("grp.")) return term.substring(4);
      if (term.startsWith("group.")) return term.substring(6);
      if (term.startsWith("r.")) return term.substring(2);
      if (term.startsWith("g.")) return term.substring(2);
      return term.substring(3); // Default: assume "rep"
    }
    
    return term;
  };

  // Get reporting group summaries with counts
  const reportingGroupSummaries = useMemo(() => {
    if (searchMode !== "reportingGroup") return [];
    
    const actualSearchTerm = getActualSearchTerm();
    if (!actualSearchTerm) return []; // Don't search with empty term
    
    const groupMap = new Map();
    
    // Group employees by reporting group
    searchData.forEach(employee => {
      if (employee.reportingGroup) {
        const groupLower = employee.reportingGroup.toLowerCase();
        if (groupLower.includes(actualSearchTerm)) {
          if (!groupMap.has(employee.reportingGroup)) {
            groupMap.set(employee.reportingGroup, {
              reportingGroup: employee.reportingGroup,
              count: 0
            });
          }
          groupMap.get(employee.reportingGroup).count++;
        }
      }
    });
    
    // Convert to array and sort by reporting group name
    return Array.from(groupMap.values())
      .sort((a, b) => a.reportingGroup.localeCompare(b.reportingGroup));
  }, [searchData, searchMode, searchTerm]);

  // Memoized filtered employee results for performance
  const filteredEmployeeResults = useMemo(() => {
    if (searchMode !== "employee" || !searchTerm.trim()) return [];
    
    const searchLower = searchTerm.toLowerCase();
    
    return searchData.filter(item => 
      (item.punchCode && item.punchCode.toLowerCase().includes(searchLower)) ||
      (item.name && item.name.toLowerCase().includes(searchLower)) ||
      (item.reportingGroup && item.reportingGroup.toLowerCase().includes(searchLower))
    ).slice(0, 50); // Limit to 50 results for performance
  }, [searchTerm, searchData, searchMode]);

  // Get active results based on the current search mode
  const activeResults = useMemo(() => {
    switch (searchMode) {
      case "reportingGroup":
        return reportingGroupSummaries;
      case "employee":
      default:
        return filteredEmployeeResults;
    }
  }, [searchMode, reportingGroupSummaries, filteredEmployeeResults]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsContainerRef.current && activeResults.length > 0) {
      const selectedElement = resultsContainerRef.current.querySelector(
        `.search-result-item[data-selected="true"]`
      );
      
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth"
        });
      }
    }
  }, [selectedIndex, activeResults]);

  // Handle employee selection
  const handleEmployeeSelection = (employee) => {
    if (employee && employee.reportingGroup) {
      // Set the reporting group through callback to update both local and parent state
      onSelect(employee.reportingGroup);
      
      // Set the filter text to what the user entered
      setFilterText(searchTerm);
      
      // Clear the search term but DON'T close the modal
      setSearchTerm("");
      setSelectedIndex(0);
      
      // Force global state refresh by dispatching an event
      // This will ensure the header dropdown updates
      const changeEvent = new CustomEvent("reportingGroupChanged", {
        detail: { group: employee.reportingGroup }
      });
      window.dispatchEvent(changeEvent);
    }
  };

  // Handle reporting group selection - sets empty filter text
  const handleReportingGroupSelection = (groupSummary) => {
    if (groupSummary && groupSummary.reportingGroup) {
      // Set the reporting group
      onSelect(groupSummary.reportingGroup);
      
      // Set an empty filter text as requested
      setFilterText("");
      
      // Clear the search term but DON'T close the modal
      setSearchTerm("");
      setSelectedIndex(0);
      
      // Force global state refresh by dispatching an event
      const changeEvent = new CustomEvent("reportingGroupChanged", {
        detail: { group: groupSummary.reportingGroup }
      });
      window.dispatchEvent(changeEvent);
    }
  };

  // Special handler for "All Groups" option
  const handleAllGroupsSelect = () => {
    // Set the reporting group to "All Groups"
    onSelect(ALL_GROUPS);
    
    // Set the filter text to empty string
    setFilterText("");
    
    // Clear the search term but DON'T close the modal
    setSearchTerm("");
    setSelectedIndex(0);
    
    // Dispatch the event for header update
    const changeEvent = new CustomEvent("reportingGroupChanged", {
      detail: { group: ALL_GROUPS }
    });
    window.dispatchEvent(changeEvent);
  };

  // Handle selection based on current mode
  const handleSelection = (item) => {
    switch (searchMode) {
      case "reportingGroup":
        handleReportingGroupSelection(item);
        break;
      case "employee":
      default:
        handleEmployeeSelection(item);
        break;
    }
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case "Escape":
        onClose();
        break;
      case "Enter":
        if (activeResults.length > 0 && selectedIndex >= 0 && selectedIndex < activeResults.length) {
          const selected = activeResults[selectedIndex];
          if (selected) {
            handleSelection(selected);
          }
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prevIndex => 
          prevIndex < activeResults.length - 1 ? prevIndex + 1 : prevIndex
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prevIndex => 
          prevIndex > 0 ? prevIndex - 1 : 0
        );
        break;
      default:
        break;
    }
  };

  // Early return for closed modal
  if (!isOpen) return null;

  return (
    <div 
      className="quick-search-modal-overlay" 
      onClick={onClose}
      onKeyDown={e => e.stopPropagation()}
    >
      <div 
        className="quick-search-modal-container" 
        onClick={e => e.stopPropagation()}
      >
        {/* Search hints and mode indicators - Moved to top */}
        <div className="search-mode-hints">
          {searchMode === "reportingGroup" && (
            <span>Searching reporting groups with "{getActualSearchTerm()}"</span>
          )}
          {searchMode === "employee" && searchTerm && (
            <span>
              <strong>Tips:</strong> Use "rep." prefix to search reporting groups
            </span>
          )}
        </div>

        {loading ? (
          <div className="search-loading">
            <div className="search-spinner"></div>
            <span>Loading employees...</span>
          </div>
        ) : (
          <>
            {/* Results Container - Moved to top */}
            {activeResults.length > 0 && (
              <div className="search-results-container" ref={resultsContainerRef}>
                {/* Special "All Groups" option at the top (only in employee mode) */}
                {searchMode === "employee" && (
                  <div 
                    className="search-result-item all-groups-option"
                    onClick={handleAllGroupsSelect}
                  >
                    <div className="result-main-info">
                      <span className="result-name">All Groups</span>
                    </div>
                    <div className="result-secondary-info">
                      <span className="result-group">View employees from all groups</span>
                    </div>
                  </div>
                )}
              
                {/* Reporting Group results */}
                {searchMode === "reportingGroup" && reportingGroupSummaries.map((group, idx) => (
                  <div
                    key={`group-${group.reportingGroup}`}
                    className="search-result-item group-item"
                    data-selected={idx === selectedIndex}
                    data-current={group.reportingGroup === selectedGroup}
                    onClick={() => handleReportingGroupSelection(group)}
                  >
                    <div className="result-main-info">
                      <span className="result-name">
                        <Users size={14} className="result-icon" />
                        {group.reportingGroup}
                      </span>
                      <span className="result-count">{group.count} employees</span>
                    </div>
                    <div className="result-secondary-info">
                      <span className="result-hint">
                        Click to switch to this reporting group
                        {group.reportingGroup === selectedGroup && (
                          <span className="current-group-marker"> (current)</span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Employee results */}
                {searchMode === "employee" && filteredEmployeeResults.map((result, idx) => (
                  <div
                    key={result.id || idx}
                    className="search-result-item employee-item"
                    data-selected={idx === selectedIndex}
                    data-current={result.reportingGroup === selectedGroup}
                    onClick={() => handleEmployeeSelection(result)}
                  >
                    <div className="result-main-info">
                      <span className="result-name">{result.name}</span>
                      {result.punchCode && (
                        <span className="result-id">{result.punchCode}</span>
                      )}
                    </div>
                    <div className="result-secondary-info">
                      {result.reportingGroup && (
                        <span className="result-group">
                          {result.reportingGroup}
                          {result.reportingGroup === selectedGroup && (
                            <span className="current-group-marker"> (current)</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchTerm && activeResults.length === 0 && (
              <div className="no-results-message">
                {searchMode === "reportingGroup" && (
                  <>No reporting groups found matching "{getActualSearchTerm()}"</>
                )}
                {searchMode === "employee" && (
                  <>No employees found matching "{searchTerm}"</>
                )}
              </div>
            )}
          </>
        )}

        {/* Input Search Field - Moved to bottom */}
        <div className="quick-search-header">
          <div className="search-icon-wrapper">
            {searchMode === "employee" && <Search size={18} />}
            {searchMode === "reportingGroup" && <Users size={18} />}
          </div>
          <input
            ref={searchInputRef}
            type="text"
            className="quick-search-input"
            placeholder={
              searchMode === "reportingGroup"
                ? "Searching reporting groups..." 
                : placeholder
            }
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
           <button 
            className="input-close-button" 
            onClick={onClose}
            aria-label="Close search"
          >
            &times;
          </button>
        </div>

        {/* Footer with keyboard shortcuts */}
        <div className="quick-search-footer">
          <div className="keyboard-shortcuts">
            <span className="shortcut-item">
              <span className="key">↑</span>
              <span className="key">↓</span>
              <span className="label">Navigate</span>
            </span>
            <span className="shortcut-item">
              <span className="key">Enter</span>
              <span className="label">Select</span>
            </span>
            <span className="shortcut-item">
              <span className="key">Esc</span>
              <span className="label">Close</span>
            </span>
          </div>
          <div className="search-tips">
            <span className="shortcut-label">Open:</span>
            <span className="key">Alt</span>+<span className="key">Shift</span>+<span className="key">S</span> or 
            <span className="key">Alt</span>+<span className="key">Shift</span>+<span className="key">F</span> |
            Type <span className="search-prefix">rep.</span> to search reporting groups
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(QuickSearchModal);