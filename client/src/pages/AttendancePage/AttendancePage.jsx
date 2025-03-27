// components/AttendancePage/AttendancePage.jsx
import React, { useState, useEffect, useRef } from "react";
import "./AttendancePage.css";
import AttendanceHeader from "./AttendanceHeader";
import AttendencePageSearchFilters from "./AttendencePageSearchFilters";
import DataRow from "./DataRow";
import { useWebSocket } from "../../hooks/useWebSocket"; // Import WebSocket hook

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
  const [isWebSocketOpen, setIsWebSocketOpen] = useState(false); // WebSocket open state
  const [showMetrics, setShowMetrics] = useState(true); // Default to showing metrics
  const [popupOpen, setPopupOpen] = useState(false);

  const { ws, send } = useWebSocket(); // WebSocket hook to send messages

  const isAdmin = user.role === "admin"; // Determine if user is admin

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

  // Handle keyboard navigation
  
  const getFilteredData = () => {
    let filteredData = [...attendanceData];

    if (filterText) {
      const searchTerm = filterText.toLowerCase();
      filteredData = filteredData.filter((item) => {
        const textMatch =
          item.name.toLowerCase().includes(searchTerm) ||
          item.punchCode.toLowerCase().includes(searchTerm) ||
          item.department.toLowerCase().includes(searchTerm) ||
          item.designation.toLowerCase().includes(searchTerm);

        const attendanceMatch = item.attendance.some(
          (att) =>
            att.netHR?.toLowerCase().includes(searchTerm) ||
            att.otHR?.toLowerCase().includes(searchTerm) ||
            att.dnShift?.toLowerCase().includes(searchTerm)
        );

        return textMatch || attendanceMatch;
      });
    }

    if (view !== "all") {
      filteredData = filteredData.filter((item) =>
        item.attendance.some(
          (att) => att.dnShift?.toLowerCase() === view.toLowerCase()
        )
      );
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

    return filteredData;
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
      user:user
    };
  
    // Send the payload via WebSocket
    send(savePayload);  

    setHasChanges(false);
  };

  const headerRef = useRef(null);
  const dataContainerRef = useRef(null);

  useEffect(() => {
    const headerWrapper = headerRef.current;
    const dataContainer = dataContainerRef.current;

    if (!headerWrapper || !dataContainer) return;

    const handleDataScroll = () => {
      headerWrapper.scrollLeft = dataContainer.scrollLeft;
    };

    const handleHeaderScroll = () => {
      dataContainer.scrollLeft = headerWrapper.scrollLeft;
    };

    dataContainer.addEventListener("scroll", handleDataScroll);
    headerWrapper.addEventListener("scroll", handleHeaderScroll);

    return () => {
      dataContainer.removeEventListener("scroll", handleDataScroll);
      headerWrapper.removeEventListener("scroll", handleHeaderScroll);
    };
  }, []);


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


  if (!attendanceData.length) {
    return (
      <div className="attendance-page">
        <div className="attendance-container">
          <div className="loading-state" style={{ textAlign: "center", padding: "40px" }}>
            Loading attendance data...
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

  const filteredData = getFilteredData();

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
          showMetrics={showMetrics}         // Add this new prop
  setShowMetrics={setShowMetrics}   // Add this new prop
  lockStatusData={lockStatusData}
        />
        <div className="header-wrapper" ref={headerRef}>
          {filteredData.length > 0 && filteredData[0].attendance && (
            <AttendanceHeader
              columns={filteredData[0].attendance}
              onSort={handleSort}
              sortConfig={sortConfig}
              fixedColumns={fixedColumns}
              handleLock={handleLock}
              handleUnlock={handleUnlock}
              popupOpen={popupOpen}
              setPopupOpen={setPopupOpen}
            />
          )}
        </div>

        {filteredData.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "var(--gray-600)",
              backgroundColor: "white",
              borderRadius: "8px",
              marginTop: "20px",
            }}
          >
            <h3>No data found</h3>
            <p>Try adjusting your filters or add new employees</p>
          </div>
        )}

        <div className="data-container" ref={dataContainerRef}>
          {filteredData.map((row, rowIndex) => (
            <DataRow
              key={row.id}
              row={row}
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
              getFilteredData={getFilteredData}
              dataContainerRef={dataContainerRef}
              attendanceData={attendanceData}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default AttendancePage;
