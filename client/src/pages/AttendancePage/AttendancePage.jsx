import React, { useState, useEffect, useRef } from "react";
import "./AttendancePage.css";
import AttendanceHeader from "./AttendanceHeader";
import AttendencePageSearchFilters from "./AttendencePageSearchFilters";
import DataRow from "./DataRow";
import { useWebSocket } from "../../hooks/useWebSocket"; // Import the WebSocket hook

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

  const { ws, send } = useWebSocket(); // WebSocket hook to send messages

  const isAdmin = user.userRole === "admin"; // Determine if user is admin

  const fixedColumns = [
    { key: "punchCode", label: "Punch Code" },
    { key: "name", label: "Name" },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
  ];

  // Fetch initial attendance data when component mounts
  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    // Send WebSocket request to fetch attendance data for the user's group and the selected month
    send("getAttendance", { group: user.userReportingGroup, month: currentMonth });
  }, [user.userReportingGroup]);

  // Handle WebSocket messages to update attendance data
  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received WebSocket message: ", data);

      // If it's attendance data, update the state
      if (data.action === "attendanceData") {
        setAttendanceData(data.attendance); // Set the fetched attendance data
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
  }, [ws]);

  // Handle WebSocket "lock" and "unlock" actions
  const handleLockAttendance = (date) => {
    send("lockAttendance", { date: date, status: "locked" });
  };

  const handleUnlockAttendance = (date) => {
    send("unlockAttendance", { date: date, status: "unlocked" });
  };

  // Handle Cell Data Update
  const handleCellDataUpdate = (rowIndex, columnIndex, field, value) => {
    const updatedEmployee = { ...attendanceData[rowIndex] };
    updatedEmployee.attendance[columnIndex][field] = value;

    // Use the WebSocket send function to send the updated data
    send("updateAttendance", { employeeId: updatedEmployee.id, updatedEmployee });
    setHasChanges(true);
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

  // Filter and sort the data
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

  // Handle sort
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Handle save changes
  const handleSaveChanges = () => {
    if (!isAdmin) {
      attendanceData.forEach(employee => {
        send("lockUserAttendance", { date: employee.attendance[0].attendance_date, user: "user" });
      });
    }
    setHasChanges(false);
  };

  const headerRef = useRef(null);
  const dataContainerRef = useRef(null);

  // Synchronize scrolling between header and data container
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
    
    // Add scroll event listeners
    dataContainer.addEventListener("scroll", handleDataScroll);
    headerWrapper.addEventListener("scroll", handleHeaderScroll);
    
    // Clean up event listeners
    return () => {
      dataContainer.removeEventListener("scroll", handleDataScroll);
      headerWrapper.removeEventListener("scroll", handleHeaderScroll);
    };
  }, []);

  // Show loading state
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

  // Show error state
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

  const filteredData = getFilteredData(); // Define filteredData correctly here

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
              onCellUpdate={handleCellDataUpdate}
              isAdmin={isAdmin}
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
