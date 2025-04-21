// components/AttendancePage/AttendancePage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./AttendancePage.css";
import AttendanceHeader from "./AttendanceHeader";
import AttendencePageSearchFilters from "./AttendencePageSearchFilters";
import DataRow from "./DataRow";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useAttendance } from "../../hooks/useAttendance";
import { useVerticalNavigation } from "../../hooks/useVerticalNavigation.js";

// Default metrics object to avoid null checks everywhere
const DEFAULT_METRICS = {
  totalNetHR: 0,
  totalOtHR: 0,
  nightShiftCount: 0,
  eveningShiftCount: 0,
  siteCommentCount: 0,
  absentCount: 0
};

// Error message component
const ErrorMessage = ({ message }) => (
  <div className="error-state" style={{ textAlign: "center", padding: "40px", color: "red" }}>
    {message}
  </div>
);

// Loading message component
const LoadingMessage = () => (
  <div className="loading-state" style={{ textAlign: "center", padding: "40px" }}>
    Loading attendance data... or change the month
  </div>
);

// Disconnect notification component
const DisconnectNotification = () => (
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
);

// Virtual list component for efficient rendering
const VirtualizedTable = React.memo(({ 
  data, 
  rowHeight = 50,
  containerRef,
  renderRow
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const scrollTop = container.scrollTop;
      const clientHeight = container.clientHeight;
      
      // Calculate which rows should be visible
      const visibleStart = Math.floor(scrollTop / rowHeight);
      const visibleCount = Math.ceil(clientHeight / rowHeight);
      const bufferSize = 5; // Extra rows above and below for smooth scrolling
      
      setVisibleRange({
        start: Math.max(0, visibleStart - bufferSize),
        end: Math.min(data.length, visibleStart + visibleCount + bufferSize)
      });
    };
    
    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Calculate initial visible area
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, data.length, rowHeight]);
  
  // Calculate total height to maintain proper scrollbar
  const totalHeight = data.length * rowHeight;
  
  // Extract only the visible rows
  const visibleRows = data.slice(visibleRange.start, visibleRange.end);
  
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
              width: '100%' 
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
  
  // Use the vertical navigation hook
  const { registerInputRef, handleKeyDown } = useVerticalNavigation(filteredData);

  // Memoize the employee metrics lookup function
  const getEmployeeMetricsById = useCallback((employeeId) => {
    if (!employeeMetrics || !Array.isArray(employeeMetrics)) {
      return DEFAULT_METRICS;
    }
    
    const metrics = employeeMetrics.find(metric => 
      metric && metric.employeeId === employeeId
    );
    
    return metrics || DEFAULT_METRICS;
  }, [employeeMetrics]);

  // Render the data row with memoization
  const renderRow = useCallback((row, index) => {
    if (!row) return null;
    
    // Find the actual index in the attendanceData array
    const rowIndex = attendanceData.findIndex(item => item.id === row.id);
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
        data={attendanceData}
        user={user}
        onCellUpdate={handleCellDataUpdate}
        getFilteredData={() => filteredData}
        dataContainerRef={dataContainerRef}
        attendanceData={attendanceData}
        isShowMetrixData={showMetrics}
        isShowDiffData={showDiff}
        MetrixDiffData={MetrixDiffData}
        attDateStart={dateRange[0]}
        attDateEnd={dateRange[1]}
        isAdmin={isAdmin}
        TotalDiffData={TotalDiffData}
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
    attendanceData, 
    hoveredRow, 
    setHoveredRow, 
    user, 
    handleCellDataUpdate, 
    filteredData,
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

        {/* No data state */}
        {nodata && filteredData.length === 0 && (
          <div className="attendance-container">
            <ErrorMessage message="No data for this filter. Change the filter..." />
          </div>
        )}

        {/* Data table section */}
        {!nodata && filteredData.length > 0 && (
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