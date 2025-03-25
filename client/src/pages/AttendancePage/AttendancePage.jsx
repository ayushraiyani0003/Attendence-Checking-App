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

  const { ws, send } = useWebSocket(); // WebSocket hook to send messages

  const isAdmin = user.role === "admin"; // Determine if user is admin
  console.log("user role"+user);

  const fixedColumns = [
    { key: "punchCode", label: "Punch Code" },
    { key: "name", label: "Name" },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
  ];

  console.log("month year" + monthYear);

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
      console.log("WebSocket connection established.");
    };

    // When the WebSocket connection is closed
    ws.onclose = () => {
      setIsWebSocketOpen(false);
      console.log("WebSocket connection closed.");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received WebSocket message: ", data);

      // If it's attendance data, update the state
      if (data.action === "attendanceData") {
        setAttendanceData(data.attendance); // Set the fetched attendance data
        setLockStatusData(data.lockStatus); // Set the lock status data

        console.log(data.attendance);
        console.log(data.lockStatus);
        // check if any date has unlocked status the setHasChanges to true
        const hasUnlockedDate = data.lockStatus.some(item => item.status === 'unlocked');
        setHasChanges(hasUnlockedDate);

      }

      // If it's an update to an attendance row, update the data
      if (data.action === "attendanceUpdated") {
        setAttendanceData((prevData) =>
          prevData.map((row) =>
            row.id === data.attendance.id ? data.attendance : row
          )
        );
      }

      // If it's a lock/unlock action, handle accordingly
      if (data.action === "attendanceLockStatus") {
        setAttendanceData((prevData) =>
          prevData.map((row) =>
            row.attendance_date === data.date
              ? { ...row, isLocked: data.status === "locked" }
              : row
          )
        );
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }, [ws, isWebSocketOpen]);

  const handleLockAttendance = (date) => {
    send({ action: "lockAttendance", date, status: "locked" });
  };

  const handleUnlockAttendance = (date) => {
    send({ action: "unlockAttendance", date, status: "unlocked" });
  };

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
        name: updatedEmployee.name,
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
  
      console.log(updatePayload);
      
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
  const onKeyDown = (e, rowIndex, column) => {
    if (!column) return;
    const [field, columnIndex] = column.split("-");
    const colIndex = parseInt(columnIndex);

    if (e.key === "Tab") {
      e.preventDefault();
      const fields = ["netHR", "otHR", "dnShift"];
      const currentFieldIndex = fields.indexOf(field);
      const filteredData = getFilteredData();
      const currentRowId = filteredData[rowIndex].id;
      const currentRowOriginalIndex = attendanceData.findIndex(
        (item) => item.id === currentRowId
      );

      if (currentFieldIndex < fields.length - 1) {
        setEditableCell({
          rowIndex: currentRowOriginalIndex,
          column: `${fields[currentFieldIndex + 1]}-${colIndex}`,
        });
      } else if (colIndex < attendanceData[currentRowOriginalIndex].attendance.length - 1) {
        setEditableCell({
          rowIndex: currentRowOriginalIndex,
          column: `${fields[0]}-${colIndex + 1}`,
        });
      } else if (rowIndex < filteredData.length - 1) {
        const nextRowId = filteredData[rowIndex + 1].id;
        const nextRowOriginalIndex = attendanceData.findIndex(
          (item) => item.id === nextRowId
        );
        setEditableCell({
          rowIndex: nextRowOriginalIndex,
          column: `${fields[0]}-0`,
        });
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      setEditableCell(null); // Save and exit editing
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditableCell(null); // Cancel editing
    }
  };

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

  console.log(filteredData);
  console.log(lockStatusData);

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
              onLock={handleLockAttendance}
              onUnlock={handleUnlockAttendance}
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
              onKeyDown={onKeyDown}
              dataContainerRef={dataContainerRef}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default AttendancePage;
