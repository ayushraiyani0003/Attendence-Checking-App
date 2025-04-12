// components/AttendancePage/AttendancePage.jsx
import React from "react";
import "./AttendancePage.css";
import AttendanceHeader from "./AttendanceHeader";
import AttendencePageSearchFilters from "./AttendencePageSearchFilters";
import DataRow from "./DataRow";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useAttendance } from "../../hooks/useAttendance";

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

  // Get filtered data without setting state directly
  const { data: filteredData } = getFilteredData();

  // Helper function to get metrics for a specific employee
  const getEmployeeMetricsById = (employeeId) => {
    if (!employeeMetrics || !Array.isArray(employeeMetrics)) {
      return {
        totalNetHR: 0,
        totalOtHR: 0,
        nightShiftCount: 0,
        eveningShiftCount: 0,
        siteCommentCount: 0,
        absentCount: 0
      };
    }
    
    const metrics = employeeMetrics.find(metric => metric.employeeId === employeeId);
    
    if (!metrics) {
      return {
        totalNetHR: 0,
        totalOtHR: 0,
        nightShiftCount: 0,
        eveningShiftCount: 0,
        siteCommentCount: 0,
        absentCount: 0
      };
    }
    
    return metrics;
  };

  if (!attendanceData.length) {
    return (
      <div className="attendance-page">
        <div className="attendance-container">
          <div className="loading-state" style={{ textAlign: "center", padding: "40px" }}>
            Loading attendance data... or change the month
          </div>
        </div>
      </div>
    );
  }

  if (isWebSocketOpen === false) {
    return (
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
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '18px'
        }}>Server Disconnected</h3>
        <p style={{
          margin: 0,
          fontSize: '14px'
        }}>Server is Disconnect. can you reload the page....</p>
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <div className="attendance-container">
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
        />

        {nodata && filteredData.length === 0 && (
          <div className="attendance-container">
            <div className="error-state" style={{ textAlign: "center", padding: "40px", color: "red" }}>
              No data For this Filter Change the filter...
            </div>
          </div>
        )}

        {/* Only render the data section if there's data to show and nodata is false */}
        {!nodata && filteredData.length > 0 && (
          <>
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

            <div className="data-container" ref={dataContainerRef}>
              {filteredData.map((row) => {
                // Find the actual index in the attendanceData array
                const rowIndex = attendanceData.findIndex((item) => item.id === row.id);
                
                // Get the metrics for this specific employee
                const metrics = getEmployeeMetricsById(row.id);

                return (
                  <DataRow
                    key={row.id}
                    row={row}
                    punchCode={row.punchCode}
                    rowIndex={rowIndex}
                    hoveredRow={hoveredRow}
                    setHoveredRow={setHoveredRow}
                    data={attendanceData}
                    user={user}
                    onCellUpdate={handleCellDataUpdate}
                    getFilteredData={() => getFilteredData().data}
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
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AttendancePage;