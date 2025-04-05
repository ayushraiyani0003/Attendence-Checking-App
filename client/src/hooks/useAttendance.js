import { useState, useEffect, useCallback, useRef } from "react";
import { getYesterday } from "../utils/constants";
import dayjs from "dayjs";
import { toast } from 'react-toastify';

export const useAttendance = (user, monthYear, ws, send) => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [filterText, setFilterText] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [view, setView] = useState("all"); // 'all', 'day', 'night'
  const [hasChanges, setHasChanges] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [lockStatusData, setLockStatusData] = useState([]);
  const [MetrixDiffData, setMetrixDiffData] = useState([]);
  const [TotalDiffData, setTotalDiffData] = useState([]);
  const [isWebSocketOpen, setIsWebSocketOpen] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);
  const [nodata, setNodata] = useState(false);
  const [dateRange, setDateRange] = useState([getYesterday(), getYesterday()]);
  const [columns, setColumns] = useState([
    { id: 'punchCode', label: 'Punch Code', isVisible: true },
    { id: 'name', label: 'Name', isVisible: true },
    { id: 'designation', label: 'Designation', isVisible: true },
    { id: 'department', label: 'Department', isVisible: false },
  ]);

  const headerRef = useRef(null);
  const dataContainerRef = useRef(null);

  const isAdmin = user.role === "admin";

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

  // Handle WebSocket events
  useEffect(() => {
    if (!ws) return;

    // When the WebSocket connection is established
    const handleOpen = () => {
      setIsWebSocketOpen(true);
      toast.info("Connected to server");
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
      toast.error("Connection to server lost. Please refresh the page.");
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
          
          toast.success("Attendance data loaded successfully");
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
          
          // Show toast for attendance update by someone else
          if (!data.updateDetails.updatedBy || data.updateDetails.updatedBy !== user.name) {
            toast.info(`${data.updateDetails.field} updated by ${data.updateDetails.updatedBy || 'another user'}`);
          }
          break;

        case "attendanceUpdateResult":
          // Show toast based on update result
          if (data.success) {
            toast.success("Attendance updated successfully");
          } else {
            toast.error(`Update failed: ${data.details || "Unknown error"}`);
          }
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
                  lock_status: 'unlocked'
                }))
              }))
            );
            setHasChanges(true);
            toast.info(`Records unlocked by ${data.changedBy || 'an administrator'}`);
          } else if (data.status === 'locked') {
            setAttendanceData((prevData) =>
              prevData.map((row) => ({
                ...row,
                attendance: row.attendance.map(att => ({
                  ...att,
                  isLocked: true,
                  lock_status: 'locked'
                }))
              }))
            );
            setHasChanges(false);
            toast.info(`Records locked by ${data.changedBy || 'an administrator'}`);
          }
          break;

        case "dataUpdated":
          toast.success("Data successfully saved to database");
          break;
          
        case "saveDataRedisToMysql":
          if (data.status === 'success') {
            toast.success("Changes saved successfully");
          } else {
            toast.error(`Failed to save changes: ${data.error || "Unknown error"}`);
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
                    lock_status: data.status
                  }
                  : att
              )
            }))
          );
          
          toast.info(`Date ${data.date} ${data.status === "locked" ? "locked" : "unlocked"}`);
          break;

        case "error":
          toast.error(`Error: ${data.details || data.message || "Unknown error"}`);
          break;

        default:
          console.warn("Unhandled WebSocket message type:", data);
      }
    };

    const handleError = (error) => {
      console.error("WebSocket error:", error);
      toast.error("Connection error. Please refresh the page.");
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

  // Sync header and data container scrolling
  useEffect(() => {
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

  // Logic for filtering data
  const getFilteredData = useCallback(() => {
    let isEmpty = false;
    // Filter to include only attendance records within the date range
    let filteredData = attendanceData.map(item => {
      // Create a copy of the employee item
      const itemCopy = {...item};
      
      // Filter the attendance array to only include dates within the range
      if (itemCopy.attendance && Array.isArray(itemCopy.attendance)) {
        itemCopy.attendance = itemCopy.attendance.filter(record => {
          if (!record.date) return false;
          
          // Parse both dates to the same format for comparison
          const recordDate = dayjs(record.date).format('YYYY-DD-MM');
          const startDate = dayjs(dateRange[0]).format('YYYY-MM-DD');
          const endDate = dayjs(dateRange[1]).format('YYYY-MM-DD');
          
          return recordDate >= startDate && recordDate <= endDate;
        });
      }
      
      return itemCopy;
    });

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
      } else if (view === "comment") {
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
      } else if (view === "new") {
        // Filter employees with punch code "new"
        filteredData = filteredData.filter(item =>
          item.punchCode?.toLowerCase() === "new"
        );
      } else if (view === "night") {
        filteredData = filteredData.filter(item => {
          // Check if the employee has an attendance array
          if (item.attendance && Array.isArray(item.attendance)) {
            // Return true if at least one attendance record has dnShift value of "n" (night)
            return item.attendance.some(record => 
              record.dnShift && record.dnShift.toLowerCase() === "n"
            );
          }
          return false; // No attendance data or not an array
        });
      } else if (view === "evening") {
        filteredData = filteredData.filter(item => {
          // Check if the employee has an attendance array
          if (item.attendance && Array.isArray(item.attendance)) {
            // Return true if at least one attendance record has dnShift value of "n" (night)
            return item.attendance.some(record => 
              record.dnShift && record.dnShift.toLowerCase() === "e"
            );
          }
          return false; // No attendance data or not an array
        });
      } else if (view === "site") {
        // Filter employees who have comments that start with "site"
        filteredData = filteredData.filter(item => {
          // Check if the employee has an attendance array
          if (item.attendance && Array.isArray(item.attendance)) {
            // Return true if at least one attendance record has a comment starting with "site" (case insensitive)
            return item.attendance.some(record => 
              record.comment && 
              record.comment.trim().toLowerCase().startsWith("site")
            );
          }
          return false; // No attendance data or not an array
        });
      } else if (view === "absent") {
        // Filter employees who have attendance records with netHR equal to 0
        filteredData = filteredData.filter(item => {
          // Check if the employee has an attendance array
          if (item.attendance && Array.isArray(item.attendance)) {
            // Return true if at least one attendance record has netHR equal to 0
            return item.attendance.some(record => 
              record.netHR === 0
            );
          }
          return false; // No attendance data or not an array
        });
      } else {
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
  }, [attendanceData, filterText, view, MetrixDiffData, sortConfig, dateRange]);
  
  // Update nodata state
  useEffect(() => {
    if (attendanceData.length > 0) {
      const { isEmpty } = getFilteredData();
      setNodata(isEmpty);
    }
  }, [view, filterText, attendanceData, MetrixDiffData, getFilteredData]);

  // Cell update handler
  const handleCellDataUpdate = (rowIndex, date, field, value) => {
    if (rowIndex < 0 || rowIndex >= attendanceData.length) {
      console.error("Invalid rowIndex:", rowIndex);
      toast.error("Invalid row selection");
      return;
    }

    const updatedEmployee = { ...attendanceData[rowIndex] };

    // Find the attendance entry with the matching date
    const columnIndex = updatedEmployee.attendance.findIndex(att => att.date === date);

    // Make sure the attendance entry with the given date exists
    if (columnIndex === -1 || !updatedEmployee.attendance) {
      console.error("Invalid date or missing attendance data:", date);
      toast.error("Invalid date selection");
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
        editDate: date,
        field: field === 'dnShift' ? 'shift_type' : field,
        newValue: value,
        oldValue: originalValue
      };

      // Update local state
      updatedEmployee.attendance[columnIndex][field] = value;

      // Send minimal update via WebSocket
      send(updatePayload);
      
      // Show toast notification for update being sent
      toast.info(`Updating ${field} for ${updatedEmployee.name}...`, {autoClose: 2000});

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

  // Sort handler
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

// Handle save changes
const handleSaveChanges = () => {
  // For admin users, ask for confirmation twice
  if (user.role === 'admin') {
    const firstConfirm = window.confirm("Are you sure you want to save these changes?");
    
    if (firstConfirm) {
      const secondConfirm = window.confirm("Please confirm once more that you want to save these changes to the database.");
      
      if (!secondConfirm) {
        return; // Exit if the user cancels the second confirmation
      }
    } else {
      return; // Exit if the user cancels the first confirmation
    }
  }

  const savePayload = {
    action: "saveDataRedisToMysql",
    monthYear: monthYear,
    user: user
  };

  // Send the payload via WebSocket
  send(savePayload);
  
  // Show toast for saving
  toast.info("Saving changes...", {autoClose: 3000});

  setHasChanges(false);
};

  // Handle lock/unlock
  const handleLock = (reportingGroup, date) => {
    if (!isAdmin) {
      toast.error("Only administrators can lock records");
      return;
    }

    const payload = {
      action: "lockUnlockStatusToggle",
      group: reportingGroup,
      date: date,
      user: user,
      status: "locked"
    };

    send(payload);
    toast.info(`Locking records for ${date}...`, {autoClose: 3000});
    setPopupOpen(false);
  };

  const handleUnlock = (reportingGroup, date) => {
    if (!isAdmin) {
      toast.error("Only administrators can unlock records");
      return;
    }

    const payload = {
      action: "lockUnlockStatusToggle",
      group: reportingGroup,
      date: date,
      user: user,
      status: "unlocked"
    };

    send(payload);
    toast.info(`Unlocking records for ${date}...`, {autoClose: 3000});
    setPopupOpen(false);
  };

  // Handle reset
  const handleReset = () => {
    setDateRange([getYesterday(), getYesterday()]);
    toast.info("Date range reset to yesterday");
  };

  return {
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
    setShowMetrics,
    popupOpen,
    setPopupOpen,
    nodata,
    dateRange,
    setDateRange,
    columns,
    isAdmin,
    headerRef,
    dataContainerRef,
    
    // Functions
    toggleColumn,
    fixedColumns,
    getFilteredData,
    handleSort,
    handleSaveChanges,
    handleCellDataUpdate,
    handleLock,
    handleUnlock,
    handleReset
  };
};