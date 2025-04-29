// components/AttendancePage/AttendancePage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./AttendancePage.css";
import AttendanceHeader from "./AttendanceHeader";
import AttendencePageSearchFilters from "./AttendencePageSearchFilters";
import DataRow from "./DataRow";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useAttendance } from "../../hooks/useAttendance";
import { useVerticalNavigation } from "../../hooks/useVerticalNavigation.js";
import { Loader2 } from "lucide-react"; // Lucide spinner icon (optional)


// Default metrics object to avoid null checks everywhere
const DEFAULT_METRICS = {
  totalNetHR: 0,
  totalOtHR: 0,
  nightShiftCount: 0,
  eveningShiftCount: 0,
  siteCommentCount: 0,
  absentCount: 0
};

// Error message component - memoized for better performance
const ErrorMessage = React.memo(({ message }) => (
  <div className="error-state" style={{ textAlign: "center", padding: "40px", color: "red" }}>
    {message}
  </div>
));

// Loading message component - memoized for better performance
const LoadingMessage = React.memo(() => (
  <div className="loading-container">
    <div className="spinner" />
    <p className="loading-main-text">Loading attendance data...</p>
    <p className="loading-sub-text">You can also try changing the month.</p>
  </div>
));

// Disconnect notification component - memoized for better performance
const DisconnectNotification = React.memo(() => (
  <div style={{
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#ff4d4f',
    color: 'white',
    padding: '16px',
    borderRadius: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 9999,
    maxWidth: '350px',
    fontFamily: 'Arial, sans-serif'
  }}>
    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
      Server Disconnected
    </h3>
    <p style={{ margin: 0, fontSize: '14px' }}>
      Server is disconnected. Please reload the page.
    </p>
  </div>
));

// Virtual list component for efficient rendering - optimized for better performance
const VirtualizedTable = React.memo(({ 
  data, 
  rowHeight = 50,
  containerRef,
  renderRow
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Use requestAnimationFrame for better scroll performance
    let frameId = null;
    
    const handleScroll = () => {
      // Cancel any pending updates
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      
      // Schedule the update on the next animation frame
      frameId = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;
        
        const scrollTop = container.scrollTop;
        const clientHeight = container.clientHeight;
        
        // Calculate which rows should be visible with increased buffer size for smoother scrolling
        const visibleStart = Math.floor(scrollTop / rowHeight);
        const visibleCount = Math.ceil(clientHeight / rowHeight);
        const bufferSize = 10; // Increased buffer for smoother scrolling
        
        setVisibleRange({
          start: Math.max(0, visibleStart - bufferSize),
          end: Math.min(data.length, visibleStart + visibleCount + bufferSize)
        });
      });
    };
    
    const container = containerRef.current;
    // Use passive event listener for better scroll performance
    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Calculate initial visible area
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [containerRef, data.length, rowHeight]);
  
  // Calculate total height to maintain proper scrollbar
  const totalHeight = data.length * rowHeight;
  
  // Extract only the visible rows - memoized to avoid unnecessary re-renders
  const visibleRows = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end);
  }, [data, visibleRange.start, visibleRange.end]);
  
  return (
    <div style={{ height: totalHeight, position: 'relative' }}>
      {visibleRows.map((row, index) => {
        const actualIndex = visibleRange.start + index;
        return (
          <div 
            key={row.id || `row-${actualIndex}`}
            style={{ 
              position: 'absolute', 
              top: actualIndex * rowHeight, 
              width: '100%',
              height: rowHeight // Explicitly set height for better layout stability
            }}
          >
            {renderRow(row, actualIndex)}
          </div>
        );
      })}
    </div>
  );
});

function AttendancePage({ user, monthYear }) {
  const { ws, send } = useWebSocket();

  const {
    // States
    hoveredRow,
    setHoveredRow,
    filterText,
    setFilterText,
    sortConfig,
    view,
    setView,
    hasChanges,
    attendanceData,
    lockStatusData,
    MetrixDiffData,
    TotalDiffData,
    isWebSocketOpen,
    showMetrics,
    showDiff,
    setShowMetrics,
    setShowDiff,
    popupOpen,
    setPopupOpen,
    nodata,
    dateRange,
    setDateRange,
    columns,
    isAdmin,
    headerRef,
    dataContainerRef,
    // total data in json format
    employeeMetrics,
    howMuchMistake,
    // Functions
    toggleColumn,
    fixedColumns,
    getFilteredData,
    handleSort,
    handleSaveChanges,
    handleCellDataUpdate,
    handleLock,
    handleUnlock
  } = useAttendance(user, monthYear, ws, send);

  // Create memoized filtered data
  const filteredData = useMemo(() => {
    try {
      const result = getFilteredData();
      return result?.data || [];
    } catch (error) {
      console.error("Error filtering data:", error);
      return [];
    }
  }, [getFilteredData]);
  
  // Use the vertical navigation hook with enhanced handling for empty cells
  const { registerInputRef, handleKeyDown } = useVerticalNavigation(filteredData, {
    skipEmptyCells: false, // Ensure we don't skip cells even if they're empty
    allowTabNavigation: true // Explicitly enable tab navigation
  });

  // Create a metrics lookup Map for O(1) access instead of O(n) search
  const metricsMap = useMemo(() => {
    if (!employeeMetrics || !Array.isArray(employeeMetrics)) {
      return new Map();
    }
    
    const map = new Map();
    employeeMetrics.forEach(metric => {
      if (metric && metric.employeeId) {
        map.set(metric.employeeId, metric);
      }
    });
    
    return map;
  }, [employeeMetrics]);

  // Optimized metrics lookup function using the Map
  const getEmployeeMetricsById = useCallback((employeeId) => {
    return metricsMap.get(employeeId) || DEFAULT_METRICS;
  }, [metricsMap]);

  // Pre-compute row indexes for faster lookup
  const rowIndexMap = useMemo(() => {
    const map = new Map();
    attendanceData.forEach((item, index) => {
      if (item && item.id) {
        map.set(item.id, index);
      }
    });
    return map;
  }, [attendanceData]);

  // Render the data row with memoization - optimized to reduce prop passing
  const renderRow = useCallback((row, index) => {
    if (!row) return null;
    
    // Use precomputed row index map instead of findIndex for better performance
    const rowIndex = rowIndexMap.get(row.id) ?? -1;
    const metrics = getEmployeeMetricsById(row.id);
    
    return (
      <DataRow
        key={row.id}
        row={row}
        punchCode={row.punchCode}
        rowIndex={rowIndex}
        sequentialIndex={index}
        hoveredRow={hoveredRow}
        setHoveredRow={setHoveredRow}
        data={attendanceData} // Restoring this prop for tab navigation to work properly
        user={user}
        onCellUpdate={handleCellDataUpdate}
        getFilteredData={() => filteredData} // Restoring this for tab navigation context
        dataContainerRef={dataContainerRef}
        attendanceData={attendanceData} // Restoring this for proper navigation context
        isShowMetrixData={showMetrics}
        isShowDiffData={showDiff}
        MetrixDiffData={MetrixDiffData}
        attDateStart={dateRange[0]}
        attDateEnd={dateRange[1]}
        isAdmin={isAdmin}
        TotalDiffData={TotalDiffData}
        // Pass metrics values directly to avoid object creation
        totalNetHR={metrics.totalNetHR}
        totalOtHR={metrics.totalOtHR}
        nightShiftCount={metrics.nightShiftCount}
        eveningShiftCount={metrics.eveningShiftCount}
        siteCommentCount={metrics.siteCommentCount}
        absentCount={metrics.absentCount}
        registerInputRef={registerInputRef}
        handleVerticalKeyDown={handleKeyDown}
      />
    );
  }, [
    rowIndexMap,
    hoveredRow, 
    setHoveredRow, 
    user, 
    handleCellDataUpdate,
    dataContainerRef, 
    showMetrics, 
    showDiff, 
    MetrixDiffData, 
    dateRange, 
    isAdmin, 
    TotalDiffData,
    getEmployeeMetricsById,
    registerInputRef,
    handleKeyDown
  ]);

  // Memoize the empty state check to avoid recomputation
  const isEmpty = useMemo(() => {
    return nodata && filteredData.length === 0;
  }, [nodata, filteredData.length]);

  // Handle loading state
  if (!attendanceData.length) {
    return (
      <div className="attendance-page">
        <div className="attendance-container">
          <LoadingMessage />
        </div>
      </div>
    );
  }

  // Handle disconnected state
  if (isWebSocketOpen === false) {
    return <DisconnectNotification />;
  }

  // Render the main component
  return (
    <div className="attendance-page">
      <div className="attendance-container">
        {/* Filters section */}
        <AttendencePageSearchFilters
          filterText={filterText}
          setFilterText={setFilterText}
          view={view}
          setView={setView}
          hasChanges={hasChanges}
          handleSaveChanges={handleSaveChanges}
          isAdmin={isAdmin}
          showMetrics={showMetrics}
          showDiff={showDiff}
          setShowMetrics={setShowMetrics}
          setShowDiff={setShowDiff}
          dateRange={dateRange}
          setDateRange={setDateRange}
          columns={columns}
          onToggleColumn={toggleColumn}
          howMuchMistake={howMuchMistake}
        />

        {/* No data state - using memoized isEmpty check */}
        {isEmpty && (
          <div className="attendance-container">
            <ErrorMessage message="No data for this filter. Change the filter..." />
          </div>
        )}

        {/* Data table section */}
        {!isEmpty && filteredData.length > 0 && (
          <>
            {/* Table header */}
            <div className="header-wrapper" ref={headerRef}>
              {filteredData[0]?.attendance && (
                <AttendanceHeader
                  columns={filteredData[0].attendance}
                  onSort={handleSort}
                  sortConfig={sortConfig}
                  fixedColumns={fixedColumns}
                  handleLock={handleLock}
                  handleUnlock={handleUnlock}
                  popupOpen={popupOpen}
                  setPopupOpen={setPopupOpen}
                  isShowMetrixData={showMetrics}
                  lockUnlock={lockStatusData}
                  attDateStart={dateRange[0]}
                  attDateEnd={dateRange[1]}
                  isAdmin={isAdmin}
                />
              )}
            </div>

            {/* Table body - virtualized for performance */}
            <div className="data-container" ref={dataContainerRef}>
              <VirtualizedTable
                data={filteredData}
                containerRef={dataContainerRef}
                renderRow={renderRow}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Memoize the entire component to prevent unnecessary renders
export default React.memo(AttendancePage);