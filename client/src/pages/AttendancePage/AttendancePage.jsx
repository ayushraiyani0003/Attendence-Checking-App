// components/AttendancePage/AttendancePage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./AttendancePage.css";
import AttendanceHeader from "./AttendanceHeader";
import AttendencePageSearchFilters from "./AttendencePageSearchFilters";
import DataRow from "./DataRow";
import { useWebSocket } from "../../hooks/useWebSocket"; // Import WebSocket hook
import { getYesterday } from "../../utils/constants";

function AttendancePage({ user, monthYear }) {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [filterText, setFilterText] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [view, setView] = useState("all"); // 'all', 'day', 'night'
  const [hasChanges, setHasChanges] = useState(false); // Track if there are unsaved changes
  const [attendanceData, setAttendanceData] = useState([]); // For storing attendance data
  const [lockStatusData, setLockStatusData] = useState([]); // For storing lock status data
  const [MetrixDiffData, setMetrixDiffData] = useState([]); // For storing lock status data
  const [TotalDiffData, setTotalDiffData] = useState([]); // For storing lock status data
  const [isWebSocketOpen, setIsWebSocketOpen] = useState(false); // WebSocket open state
  const [showMetrics, setShowMetrics] = useState(true); // Default to showing metrics
  const [popupOpen, setPopupOpen] = useState(false);
  const [nodata, setNodata] = useState(false);
  // State for the date range
  const [dateRange, setDateRange] = useState([getYesterday(), getYesterday()]);
  // Add displayWeeks state which is needed by DataRow

  const [columns, setColumns] = useState([
    { id: 'punchCode', label: 'Punch Code', isVisible: true },
    { id: 'name', label: 'Name', isVisible: true },
    { id: 'designation', label: 'Designation', isVisible: true },
    { id: 'department', label: 'Department', isVisible: false },
  ]);

  const { ws, send } = useWebSocket(); // WebSocket hook to send messages

  const isAdmin = user.role === "admin"; // Determine if user is admin

  const toggleColumn = (columnId) => {
    setColumns(columns.map(column =>
      column.id === columnId
        ? { ...column, isVisible: !column.isVisible }
        : column
    ));
  };

  const fixedColumns = [
    { key: "punchCode", label: "Punch Code" },
    { key: "name", label: "Name" },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
  ];

  // Fetch initial attendance data when component mounts
  useEffect(() => {
    if (ws && isWebSocketOpen) {
      send({
        action: "getAttendance",
        group: user.userReportingGroup,
        month: monthYear,
        user: user
      });
    }
  }, [user.userReportingGroup, monthYear, isWebSocketOpen, ws, send]);

  // Handler to reset everything
  const handleReset = () => {
    // Reset to yesterday's date
    setDateRange([getYesterday(), getYesterday()]);
  };

  useEffect(() => {
    if (!ws) return;

    // When the WebSocket connection is established
    const handleOpen = () => {
      setIsWebSocketOpen(true);
      ws.send(JSON.stringify({
        action: 'setUserInfo',
        user: {
          userRole: user.role,
          userReportingGroup: user.userReportingGroup,
          name: user.name,
          id: user.id
        }
      }));
    };

    // When the WebSocket connection is closed
    const handleClose = () => {
      setIsWebSocketOpen(false);
    };

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);

      // Handle different types of broadcast messages
      switch (data.action || data.type) {
        case "attendanceData":
          setAttendanceData(data.attendance);
          setLockStatusData(data.lockStatus);
          setMetrixDiffData(data.MetrixAtteDiffrence || []);
          setTotalDiffData(data.totalTimeDiff || []);


          // Check if any date has unlocked status
          const hasUnlockedDate = data.lockStatus?.some(item => item.status === 'unlocked');
          setHasChanges(hasUnlockedDate);
          break;

        case "attendanceUpdated":
          // Update specific employee's attendance
          setAttendanceData((prevData) =>
            prevData.map((row) =>
              row.id === data.updateDetails.employeeId
                ? {
                  ...row,
                  attendance: row.attendance.map(att =>
                    att.date === data.updateDetails.editDate
                      ? {
                        ...att,
                        [data.updateDetails.field]: data.updateDetails.newValue
                      }
                      : att
                  )
                }
                : row
            )
          );
          break;

        case "lockUnlockStatusChanged":
          // Handle lock/unlock status changes
          if (data.status === 'unlocked') {
            setAttendanceData((prevData) =>
              prevData.map((row) => ({
                ...row,
                attendance: row.attendance.map(att => ({
                  ...att,
                  isLocked: false,
                  lock_status: 'unlocked' // Add lock_status for DataRow component
                }))
              }))
            );
            setHasChanges(true);
          } else if (data.status === 'locked') {
            setAttendanceData((prevData) =>
              prevData.map((row) => ({
                ...row,
                attendance: row.attendance.map(att => ({
                  ...att,
                  isLocked: true,
                  lock_status: 'locked' // Add lock_status for DataRow component
                }))
              }))
            );
            setHasChanges(false);
          }
          break;

        case "attendanceLockStatus":
          setAttendanceData((prevData) =>
            prevData.map((row) => ({
              ...row,
              attendance: row.attendance.map(att =>
                att.date === data.date
                  ? {
                    ...att,
                    isLocked: data.status === "locked",
                    lock_status: data.status // Add lock_status for DataRow component
                  }
                  : att
              )
            }))
          );
          break;

        default:
          console.warn("Unhandled WebSocket message type:", data);
      }
    };

    const handleError = (error) => {
      console.error("WebSocket error:", error);
    };

    // Assign event handlers
    ws.onopen = handleOpen;
    ws.onclose = handleClose;
    ws.onmessage = handleMessage;
    ws.onerror = handleError;

    // Cleanup function
    return () => {
      if (ws) {
        ws.onopen = null;
        ws.onclose = null;
        ws.onmessage = null;
        ws.onerror = null;
      }
    };
  }, [ws, user]);

  // Handle Cell Data Update
  // Handle Cell Data Update
  const handleCellDataUpdate = (rowIndex, date, field, value) => {
    if (rowIndex < 0 || rowIndex >= attendanceData.length) {
      console.error("Invalid rowIndex:", rowIndex);
      return;
    }

    const updatedEmployee = { ...attendanceData[rowIndex] };

    // Find the attendance entry with the matching date
    const columnIndex = updatedEmployee.attendance.findIndex(att => att.date === date);

    // Make sure the attendance entry with the given date exists
    if (columnIndex === -1 || !updatedEmployee.attendance) {
      console.error("Invalid date or missing attendance data:", date);
      return;
    }

    const originalValue = updatedEmployee.attendance[columnIndex][field];

    // Only send update if the value has actually changed
    if (originalValue !== value) {
      // Prepare minimal payload with only necessary information
      const updatePayload = {
        action: "updateAttendance",
        employeeId: updatedEmployee.id,
        punchCode: updatedEmployee.punchCode,
        user: user,
        reportGroup: updatedEmployee.reporting_group,
        editDate: date, // Use date directly instead of accessing by columnIndex
        field: field === 'dnShift' ? 'shift_type' : field, // Specific field being updated
        newValue: value,
        oldValue: originalValue
      };

      // Update local state
      updatedEmployee.attendance[columnIndex][field] = value;

      // Send minimal update via WebSocket
      send(updatePayload);

      // Set has changes to true
      setHasChanges(true);

      // Update the local state
      setAttendanceData(prevData =>
        prevData.map((employee, index) =>
          index === rowIndex ? updatedEmployee : employee
        )
      );
    }
  };
  // Modify your getFilteredData function to prevent state updates during rendering
  const getFilteredData = useCallback(() => {
    let filteredData = [...attendanceData];
    let isEmpty = false;

    if (filterText) {
      const searchTerm = filterText.toLowerCase();
      filteredData = filteredData.filter((item) => {
        const textMatch =
          item.name?.toLowerCase().includes(searchTerm) ||
          item.punchCode?.toLowerCase().includes(searchTerm) ||
          item.department?.toLowerCase().includes(searchTerm) ||
          item.designation?.toLowerCase().includes(searchTerm);

        return textMatch;
      });
    }

    if (view !== "all") {
      if (view === "diff") {
        // 1. Get all punch codes where netHRDiff or otHRDiff > 0.25
        const punchCodesWithDiff = MetrixDiffData
          .filter(item =>
            Math.abs(parseFloat(item.netHRDiff)) > 0.25 ||
            Math.abs(parseFloat(item.otHRDiff)) > 0.25
          )
          .map(item => item.punchCode);

        // 2. Remove duplicates (same punch code may appear multiple times)
        const uniquePunchCodes = [...new Set(punchCodesWithDiff)];

        // 3. Filter employees whose punchCode is in uniquePunchCodes
        filteredData = filteredData.filter(item =>
          uniquePunchCodes.includes(item.punchCode)
        );
      }else if (view === "comment") {
        // Filter employees who have at least one attendance record with a non-empty comment
        filteredData = filteredData.filter(item => {
          // Check if the employee has an attendance array
          if (item.attendance && Array.isArray(item.attendance)) {
            // Return true if at least one attendance record has a non-empty comment
            return item.attendance.some(record => 
              record.comment && record.comment.trim() !== ""
            );
          }
          return false; // No attendance data or not an array
        });
      }

      else if (view === "new") {
        // Filter employees with punch code "new"
        filteredData = filteredData.filter(item =>
          item.punchCode?.toLowerCase() === "new"
        );
      }
      else {
        // Filter by shift (original logic)
        filteredData = filteredData.filter(item =>
          item.attendance?.some(att =>
            att.dnShift?.toLowerCase() === view.toLowerCase()
          )
        );
      }

      // Set the isEmpty flag for filtering
      isEmpty = filteredData.length === 0;
    }

    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key.startsWith("attendance.")) {
          const field = sortConfig.key.split(".")[1];
          aValue = a.attendance?.[0]?.[field] || "";
          bValue = b.attendance?.[0]?.[field] || "";
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return { data: filteredData, isEmpty };
  }, [attendanceData, filterText, view, MetrixDiffData, sortConfig]);

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleSaveChanges = () => {
    const savePayload = {
      action: "saveDataRedisToMysql",
      monthYear: monthYear,  // The month and year
      user: user
    };

    // Send the payload via WebSocket
    send(savePayload);

    setHasChanges(false);
  };

  const headerRef = useRef(null);
  const dataContainerRef = useRef(null);

  useEffect(() => {
    // Wait for both refs to be populated and data to be loaded
    const headerWrapper = headerRef.current;
    const dataContainer = dataContainerRef.current;

    if (!headerWrapper || !dataContainer || !attendanceData.length) return;

    // Scroll handler functions
    const handleDataScroll = () => {
      headerWrapper.scrollLeft = dataContainer.scrollLeft;
    };

    const handleHeaderScroll = () => {
      dataContainer.scrollLeft = headerWrapper.scrollLeft;
    };

    // Add the event listeners
    dataContainer.addEventListener("scroll", handleDataScroll);
    headerWrapper.addEventListener("scroll", handleHeaderScroll);

    // Cleanup function to remove event listeners
    return () => {
      dataContainer.removeEventListener("scroll", handleDataScroll);
      headerWrapper.removeEventListener("scroll", handleHeaderScroll);
    };
  }, [attendanceData]);

  // Use useEffect to update the nodata state
  useEffect(() => {
    if (attendanceData.length > 0) {
      const { isEmpty } = getFilteredData();
      setNodata(isEmpty);
    }
  }, [view, filterText, attendanceData, MetrixDiffData, getFilteredData]);

  const handleLock = (reportingGroup, date) => {
    // Only proceed if user is Admin
    if (!isAdmin) return;

    const payload = {
      action: "lockUnlockStatusToggle",
      group: reportingGroup,
      date: date,
      user: user,
      status: "locked"
    };

    // Send the payload via WebSocket
    send(payload);

    setPopupOpen(false);
  };

  const handleUnlock = (reportingGroup, date) => {
    // Only proceed if user is Admin
    if (!isAdmin) return;

    const payload = {
      action: "lockUnlockStatusToggle",
      group: reportingGroup,
      date: date,
      user: user,
      status: "unlocked"
    };

    // Send the payload via WebSocket
    send(payload);

    setPopupOpen(false);
  };

  // Get filtered data without setting state directly
  const { data: filteredData } = getFilteredData();

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
        }}>Services will be back as soon as possible.</p>
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
          setShowMetrics={setShowMetrics}
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
                    MetrixDiffData={MetrixDiffData}
                    attDateStart={dateRange[0]}
                    attDateEnd={dateRange[1]}
                    isAdmin={isAdmin}
                    TotalDiffData={TotalDiffData}
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