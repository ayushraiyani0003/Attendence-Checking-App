// components/AttendancePage/AttendancePage.jsx
import React, { useState, useEffect, useRef ,useCallback} from "react";
import "./AttendancePage.css";
import AttendanceHeader from "./AttendanceHeader";
import AttendencePageSearchFilters from "./AttendencePageSearchFilters";
import DataRow from "./DataRow";
import { useWebSocket } from "../../hooks/useWebSocket"; // Import WebSocket hook
import moment from 'moment-timezone';
import { getYesterday } from "../../utils/constants";

function AttendancePage({ user, monthYear }) {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [editableCell, setEditableCell] = useState(null);
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
  const [isWebSocketOpen, setIsWebSocketOpen] = useState(false); // WebSocket open state
  const [showMetrics, setShowMetrics] = useState(true); // Default to showing metrics
  const [popupOpen, setPopupOpen] = useState(false);
  const [nodata, setNodata] = useState(false);
  // State for the date range
  const [dateRange, setDateRange] = useState([getYesterday(), getYesterday()]);

  const [columns, setColumns] = useState([
    { id: 'punchCode', label: 'Punch Code', isVisible: true },
    { id: 'name', label: 'Name', isVisible: true },
    { id: 'designation', label: 'Designation', isVisible: true },
    { id: 'department', label: 'Department', isVisible: false },
  ]);


  const { ws, send } = useWebSocket(); // WebSocket hook to send messages

  const isAdmin = user.role === "admin"; // Determine if user is admin
  console.log(dateRange);

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
    ws.onopen = () => {
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

      return ws;
    };

    // When the WebSocket connection is closed
    ws.onclose = () => {
      setIsWebSocketOpen(false);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Handle different types of broadcast messages
      switch (data.action || data.type) {
        case "attendanceData":
          setAttendanceData(data.attendance);
          setLockStatusData(data.lockStatus);
          setMetrixDiffData(data.MetrixAtteDiffrence);

          // Check if any date has unlocked status
          const hasUnlockedDate = data.lockStatus.some(item => item.status === 'unlocked');
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
                  isLocked: false
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
                  isLocked: true
                }))
              }))
            );
            setHasChanges(false);
          }
          break;

        case "dataUpdated":
          // Optional: Handle general data update broadcasts
          break;

        case "attendanceLockStatus":
          setAttendanceData((prevData) =>
            prevData.map((row) =>
              row.attendance_date === data.date
                ? { ...row, isLocked: data.status === "locked" }
                : row
            )
          );
          break;

        default:
          console.warn("Unhandled WebSocket message type:", data);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Cleanup function
    return () => {
      if (ws) {
        ws.onopen = null;
        ws.onclose = null;
        ws.onmessage = null;
        ws.onerror = null;
      }
    };
  }, [ws, isWebSocketOpen]);

  // Handle Cell Data Update
  const handleCellDataUpdate = (rowIndex, columnIndex, field, value) => {
    const updatedEmployee = { ...attendanceData[rowIndex] };
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
        editDate: updatedEmployee.attendance[columnIndex].date,
        field: field, // Specific field being updated
        newValue: value,
        oldValue: originalValue
      };

      // Update local state
      updatedEmployee.attendance[columnIndex][field] = value;

      // Send minimal update via WebSocket
      send(updatePayload);

      // Set has changes to true
      setHasChanges(true);

      // Optionally update the local state
      setAttendanceData(prevData =>
        prevData.map((employee, index) =>
          index === rowIndex ? updatedEmployee : employee
        )
      );
    }
  };

  // Get the first and last dates of the current month

  // Handle keyboard navigation
   // Modify your getFilteredData function to prevent state updates during rendering
   const getFilteredData = () => {
    let filteredData = [...attendanceData];
    let isEmpty = false;

    if (filterText) {
      const searchTerm = filterText.toLowerCase();
      filteredData = filteredData.filter((item) => {
        const textMatch =
          item.name.toLowerCase().includes(searchTerm) ||
          item.punchCode.toLowerCase().includes(searchTerm) ||
          item.department.toLowerCase().includes(searchTerm) ||
          item.designation.toLowerCase().includes(searchTerm);

        return textMatch;
      });
    }

    if (view !== "all") {
      if (view === "diffsd") {
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
          item.attendance.some(att =>
            att.dnShift?.toLowerCase() === view.toLowerCase()
          )
        );
      }

      // Instead of directly setting state during render, return a flag
      isEmpty = filteredData.length === 0;
    }

    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key.startsWith("attendance.")) {
          const field = sortConfig.key.split(".")[1];
          aValue = a.attendance[0]?.[field] || "";
          bValue = b.attendance[0]?.[field] || "";
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
  };

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

    // Include dependencies that should trigger re-running this effect
  }, [attendanceData, headerRef.current, dataContainerRef.current]);

// Use useEffect to update the nodata state instead of doing it during rendering
useEffect(() => {
  if (attendanceData.length > 0) {
    const { isEmpty } = getFilteredData();
    setNodata(isEmpty);
  }
}, [view, filterText, attendanceData, MetrixDiffData]);

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
      group: reportingGroup, // Assuming selectedDate is the group, if not, replace this
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

  if (!attendanceData) {
    return (
      <div className="attendance-page">
        <div className="attendance-container">
          <div className="error-state" style={{ textAlign: "center", padding: "40px", color: "red" }}>
            Error loading data.
          </div>
        </div>
      </div>
    );
  }


  console.log("filteredData");
  console.log(filteredData);

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

        {nodata && filteredData.length ==0 &&(
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
                  fixedColumns={columns}
                  handleLock={handleLock}
                  handleUnlock={handleUnlock}
                  popupOpen={popupOpen}
                  setPopupOpen={setPopupOpen}
                  isShowMetrixData={showMetrics}
                  lockUnlock={lockStatusData}
                  attDateStart={dateRange[0]}
                  attDateEnd={dateRange[1]}
                />
              )}
            </div>

            <div className="data-container" ref={dataContainerRef}>
              {filteredData.map((row, rowIndex) => (
                <DataRow
                  key={row.id}
                  row={row}
                  punchCode={row.punchCode}
                  rowIndex={attendanceData.findIndex((item) => item.id === row.id)}
                  hoveredRow={hoveredRow}
                  setHoveredRow={setHoveredRow}
                  editableCell={editableCell}
                  setEditableCell={setEditableCell}
                  data={attendanceData}
                  setData={(newData) => {
                    const changedRow = newData.find((item, idx) =>
                      JSON.stringify(item) !== JSON.stringify(attendanceData[idx])
                    );
                    if (changedRow) {
                      send("updateAttendance", { employeeId: changedRow.id, updatedEmployee: changedRow });
                    }
                    setHasChanges(true);
                  }}
                  lockStatusData={lockStatusData}
                  user={user}
                  onCellUpdate={handleCellDataUpdate}
                  getFilteredData={() => getFilteredData().data}
                  dataContainerRef={dataContainerRef}
                  attendanceData={attendanceData}
                  isShowMetrixData={showMetrics}
                  MetrixDiffData={MetrixDiffData}
                  attDateStart={dateRange[0]}
                  attDateEnd={dateRange[1]}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AttendancePage;
