import { useState, useEffect, useCallback, useRef } from "react";
import { getYesterday } from "../utils/constants";
import dayjs from "dayjs";
import { toast } from 'react-toastify';

// Helper function to get the storage key for employee order
const getStorageKey = () => {
  return `employee_order_default`;
};

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
  const [howMuchMistake, sethowMuchMistake] = useState();
  const [lockStatusData, setLockStatusData] = useState([]);
  const [MetrixDiffData, setMetrixDiffData] = useState([]);
  const [TotalDiffData, setTotalDiffData] = useState([]);
  const [isWebSocketOpen, setIsWebSocketOpen] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showDiff, setShowDiff] = useState(false);
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

  // Helper function to convert DD/MM/YYYY to a Date object for sorting
  const convertDateForSorting = (dateString) => {
    if (!dateString) return null;

    // Parse the date string in DD/MM/YYYY format
    const [day, month, year] = dateString.split('/');

    // Create a date object (months are 0-indexed in JavaScript)
    return new Date(year, month - 1, day);
  };

  // Helper function to sort attendance data based on saved employee order
  const sortEmployeesByCustomOrder = (data) => {
    // Try to get saved order from localStorage
    const savedOrderJson = localStorage.getItem(getStorageKey());

    if (!savedOrderJson) {
      return data; // Return original data if no saved order exists
    }

    try {
      // Parse the saved order JSON
      const savedOrder = JSON.parse(savedOrderJson);

      // Create a map for quick lookup of display order by employee ID
      const orderMap = new Map();
      savedOrder.forEach(item => {
        orderMap.set(item.employeeId, item.displayOrder);
      });

      // Sort the attendance data based on the saved order
      return [...data].sort((a, b) => {
        // Get display orders (default to a high number if not found)
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id) : Number.MAX_SAFE_INTEGER;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id) : Number.MAX_SAFE_INTEGER;

        // Sort by display order
        return orderA - orderB;
      });
    } catch (error) {
      console.error("Error parsing saved employee order:", error);
      return data; // Return original data if error occurs
    }
  };

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
          // Sort each employee's attendance array by date before setting state
          let sortedAttendanceData = data.attendance;
          if (sortedAttendanceData && Array.isArray(sortedAttendanceData)) {
            sortedAttendanceData = sortedAttendanceData.map(employee => {
              if (employee.attendance && Array.isArray(employee.attendance)) {
                // Create a copy and sort attendance by date
                const sortedAttendance = [...employee.attendance].sort((a, b) => {
                  const dateA = convertDateForSorting(a.date);
                  const dateB = convertDateForSorting(b.date);

                  // Handle null values
                  if (!dateA && !dateB) return 0;
                  if (!dateA) return 1;
                  if (!dateB) return -1;

                  return dateA - dateB;
                });

                return { ...employee, attendance: sortedAttendance };
              }
              return employee;
            });

            // Apply custom employee ordering based on localStorage
            sortedAttendanceData = sortEmployeesByCustomOrder(sortedAttendanceData);
          }

          setAttendanceData(sortedAttendanceData);
          setLockStatusData(data.lockStatus);
          setMetrixDiffData(data.metricsAttendanceDifference || []);
          setTotalDiffData(data.totalTimeDiff || []);

          // Calculate total mistakes
          if (data.metricsAttendanceDifference && Array.isArray(data.metricsAttendanceDifference)) {
            let totalMistakes = 0;

            data.metricsAttendanceDifference.forEach(item => {
              // Count netHRDiff > 0.25 as one mistake
              if (Math.abs(parseFloat(item.netHRDiff)) > 0.25) {
                totalMistakes += 1;
              }

              // Count otHRDiff > 0.25 as another mistake
              if (Math.abs(parseFloat(item.otHRDiff)) > 0.25) {
                totalMistakes += 1;
              }
            });

            // console.log("Total mistakes calculated:", totalMistakes);
            sethowMuchMistake(totalMistakes);
          } else {
            sethowMuchMistake(0);
          }

          // Check if any date has unlocked status
          const hasUnlockedDate = data.lockStatus?.some(item => item.status === 'unlocked');
          setHasChanges(hasUnlockedDate);

          toast.success("Attendance data loaded successfully");
          break;

        case "attendanceUpdated":
          // Update specific employee's attendance
          setAttendanceData((prevData) => {
            const updatedData = prevData.map((row) => {
              if (row.id === data.updateDetails.employeeId) {
                // Update the specific attendance record
                const updatedAttendance = row.attendance.map(att =>
                  att.date === data.updateDetails.editDate
                    ? {
                      ...att,
                      [data.updateDetails.field]: data.updateDetails.newValue
                    }
                    : att
                );

                // Sort the updated attendance array by date
                const sortedAttendance = [...updatedAttendance].sort((a, b) => {
                  const dateA = convertDateForSorting(a.date);
                  const dateB = convertDateForSorting(b.date);

                  if (!dateA && !dateB) return 0;
                  if (!dateA) return 1;
                  if (!dateB) return -1;

                  return dateA - dateB;
                });

                return {
                  ...row,
                  attendance: sortedAttendance
                };
              }
              return row;
            });

            // Apply custom employee ordering again after update
            return sortEmployeesByCustomOrder(updatedData);
          });

          // Show toast for attendance update by someone else
          if (!data.updateDetails.updatedBy || data.updateDetails.updatedBy !== user.name) {
            toast.info(`${data.updateDetails.field} updated by ${data.updateDetails.updatedBy || 'another user'}`);
          }
          break;

        // ... rest of the cases remain unchanged
        // Add this to your error handling in the attendanceUpdateResult case
        case "attendanceUpdateResult":
          // Show toast based on update result
          if (data.success) {
            toast.success("Attendance updated successfully");
          } else {
            // Check if the error message contains the specific text about no existing data
            if (data.details && data.details.toLowerCase().includes("no existing data")) {
              toast.error("This attendance record is locked. Please request an admin to unlock it before making changes.");
            } else {
              toast.error(`Update failed: ${data.details || "Unknown error"}`);
            }
          }
          break;

        // This is the corrected code for the lockStatusUpdate case in your handleMessage function
        case "lockStatusUpdate":
          // New case to handle lock/unlock status updates from server
          console.log("Received lock status update:", data);

          // Get the date from the message
          const updateDate = data.date; // This should be in YYYY-MM-DD format

          // Parse the date from YYYY-MM-DD to DD/MM/YYYY for comparison with attendance records
          let formattedDate = "";
          if (updateDate && updateDate.includes('-')) {
            const [year, month, day] = updateDate.split('-');
            formattedDate = `${day}/${month}/${year}`;
          }

          console.log(`Formatted date for comparison: ${formattedDate}`);
          console.log(`Target groups: ${JSON.stringify(data.groups)}`);

          // Update the attendance data with the new lock status
          setAttendanceData((prevData) => {
            // First, create a deep copy to avoid mutation issues
            const updatedData = JSON.parse(JSON.stringify(prevData));

            // Convert target groups to an array if it's not already
            const targetGroups = Array.isArray(data.groups) ? data.groups : [data.groups];
            let updateCount = 0;

            // Loop through each employee
            for (let i = 0; i < updatedData.length; i++) {
              const employee = updatedData[i];

              // Check if this employee belongs to one of the target groups
              if (employee.reporting_group && targetGroups.includes(employee.reporting_group)) {
                // Update all attendance records for this date
                if (employee.attendance && Array.isArray(employee.attendance)) {
                  for (let j = 0; j < employee.attendance.length; j++) {
                    const record = employee.attendance[j];

                    if (record.date === formattedDate) {
                      updatedData[i].attendance[j] = {
                        ...record,
                        isLocked: data.status === 'locked',
                        lock_status: data.status
                      };
                      updateCount++;
                    }
                  }
                }
              }
            }

            console.log(`Updated ${updateCount} attendance records with new lock status`);

            // Apply custom employee ordering
            return sortEmployeesByCustomOrder(updatedData);
          });

          // Update lock status in lockStatusData
          setLockStatusData((prevLockStatus) => {
            // Find if we already have this date in our lockStatusData
            const dateIndex = prevLockStatus.findIndex(item =>
              item.date === updateDate || item.dateFormattedString === updateDate
            );

            // Create a copy of the previous lock status
            const newLockStatus = [...prevLockStatus];

            if (dateIndex >= 0) {
              // Update existing lock status
              newLockStatus[dateIndex] = {
                ...newLockStatus[dateIndex],
                status: data.status,
                groups: data.groups
              };
            } else {
              // Add new lock status
              newLockStatus.push({
                date: updateDate,
                dateFormattedString: updateDate,
                status: data.status,
                groups: data.groups
              });
            }

            return newLockStatus;
          });

          // Update hasChanges based on lock status
          setHasChanges(prev => {
            const newHasChanges = data.status === 'unlocked';
            console.log(`Setting hasChanges to ${newHasChanges} based on lock status ${data.status}`);
            return newHasChanges;
          });

          // Show toast notification
          toast.info(`Records ${data.status} by ${data.changedBy || 'an administrator'}`);
          break;
        // Legacy case for backward compatibility - can be removed if all server code is updated
        case "lockUnlockStatusChanged":
          // Update attendance data with the new lock status
          console.log("Received legacy lock status change:", data);

          // Get the date from the message
          const legacyUpdateDate = data.date; // This should be in YYYY-MM-DD format

          // Parse the date from YYYY-MM-DD to DD/MM/YYYY for comparison with attendance records
          let legacyFormattedDate = "";
          if (legacyUpdateDate && legacyUpdateDate.includes('-')) {
            const [year, month, day] = legacyUpdateDate.split('-');
            legacyFormattedDate = `${day}/${month}/${year}`;
          }

          // Update the attendance data with the new lock status
          setAttendanceData((prevData) => {
            const updatedData = prevData.map((row) => {
              // Only update if this employee is in one of the affected groups
              if (data.groups && data.groups.includes(row.reporting_group)) {
                // Update attendance records for this date
                const updatedAttendance = row.attendance.map(att => {
                  if (att.date === legacyFormattedDate) {
                    return {
                      ...att,
                      isLocked: data.status === 'locked',
                      lock_status: data.status
                    };
                  }
                  return att;
                });

                return {
                  ...row,
                  attendance: updatedAttendance
                };
              }
              return row;
            });

            return sortEmployeesByCustomOrder(updatedData);
          });

          // Update hasChanges based on lock status
          setHasChanges(data.status === 'unlocked');

          // Show toast notification
          toast.info(`Records ${data.status} by ${data.changedBy || 'an administrator'}`);
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
          setAttendanceData((prevData) => {
            const updatedData = prevData.map((row) => ({
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
            }));
            return sortEmployeesByCustomOrder(updatedData);
          });

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

  // Calculate total mistakes when MetrixDiffData changes
  useEffect(() => {
    if (MetrixDiffData && Array.isArray(MetrixDiffData)) {
      let totalMistakes = 0;

      MetrixDiffData.forEach(item => {
        // Count netHRDiff > 0.25 as one mistake
        if (Math.abs(parseFloat(item.netHRDiff)) > 0.25) {
          totalMistakes += 1;
        }

        // Count otHRDiff > 0.25 as another mistake
        if (Math.abs(parseFloat(item.otHRDiff)) > 0.25) {
          totalMistakes += 1;
        }
      });

      sethowMuchMistake(totalMistakes);
    } else {
      sethowMuchMistake(0);
    }
  }, [MetrixDiffData]);

  // Logic for filtering data
  const getFilteredData = useCallback(() => {
    let isEmpty = false;
    // Filter to include only attendance records within the date range
    let filteredData = attendanceData.map(item => {
      // Create a copy of the employee item
      const itemCopy = { ...item };

      // Filter the attendance array to only include dates within the range
      if (itemCopy.attendance && Array.isArray(itemCopy.attendance)) {
        // Define possible date formats to try
        const dateFormats = ["DD/MM/YYYY", "D/M/YYYY", "MM/DD/YYYY", "M/D/YYYY"];

        // Parse date with multiple possible formats
        const parseDate = (dateStr) => {
          if (!dateStr) return null;

          // Try each format until one works
          for (const format of dateFormats) {
            const parsed = dayjs(dateStr, format);
            if (parsed.isValid()) {
              return parsed;
            }
          }
          // console.log(`Could not parse date: ${dateStr}`);
          return null;
        };

        const startParsed = parseDate(dateRange[0]);
        const endParsed = parseDate(dateRange[1]);
        const startDate = startParsed ? startParsed.format('YYYY-MM-DD') : null;
        const endDate = endParsed ? endParsed.format('YYYY-MM-DD') : null;

        itemCopy.attendance = itemCopy.attendance.filter(record => {
          if (!record.date) return false;

          const parsedRecord = parseDate(record.date);
          if (!parsedRecord) return false;

          const recordDate = parsedRecord.format('YYYY-MM-DD');

          return recordDate >= startDate && recordDate <= endDate;
        });

        // Sort attendance records by date
        itemCopy.attendance = itemCopy.attendance.sort((a, b) => {
          const parsedA = parseDate(a.date);
          const parsedB = parseDate(b.date);

          const dateA = parsedA ? parsedA.valueOf() : null;
          const dateB = parsedB ? parsedB.valueOf() : null;

          // Handle null values
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;

          return dateA - dateB;
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
    } else {
      // If not using any other sort, maintain custom order
      filteredData = sortEmployeesByCustomOrder(filteredData);
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
      // toast.error("Invalid row selection");
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
    if (String(originalValue).trim() !== String(value).trim()) { // the vause is in the string thats why problem acured.

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

      // Sort the attendance array after update
      updatedEmployee.attendance.sort((a, b) => {
        const dateA = convertDateForSorting(a.date);
        const dateB = convertDateForSorting(b.date);

        // Handle null values
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return dateA - dateB;
      });

      // Send minimal update via WebSocket
      send(updatePayload);

      // Show toast notification for update being sent
      toast.info(`Updating ${field} for ${updatedEmployee.name}...`, { autoClose: 2000 });

      // Set has changes to true
      setHasChanges(true);

      // Update the local state
      setAttendanceData(prevData => {
        const updatedData = prevData.map((employee, index) =>
          index === rowIndex ? updatedEmployee : employee
        );

        // Apply custom ordering to the updated data
        return sortEmployeesByCustomOrder(updatedData);
      });
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
    toast.info("Saving changes...", { autoClose: 3000 });

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
    toast.info(`Locking records for ${date}...`, { autoClose: 3000 });
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
    toast.info(`Unlocking records for ${date}...`, { autoClose: 3000 });
    setPopupOpen(false);
  };

  // Handle reset
  const handleReset = () => {
    setDateRange([getYesterday(), getYesterday()]);
    toast.info("Date range reset to yesterday");
  };

  // Function to calculate metrics for each employee
  function calculateEmployeeMetrics(attendanceData) {
    if (!attendanceData || !Array.isArray(attendanceData) || attendanceData.length === 0) {
      return [];
    }

    return attendanceData.map(employee => {
      let totalNetHR = 0;
      let totalOtHR = 0;
      let nightShiftCount = 0;
      let eveningShiftCount = 0;
      let siteCommentCount = 0;
      let absentCount = 0;

      // Process attendance records if they exist
      if (employee.attendance && Array.isArray(employee.attendance)) {
        employee.attendance.forEach(record => {
          // Calculate totalNetHR
          if (typeof record.netHR === 'number') {
            totalNetHR += record.netHR;

            // Count absent days (netHR = 0)
            if (record.netHR === 0) {
              absentCount++;
            }
          }

          // Calculate totalOtHR
          if (typeof record.otHR === 'number') {
            totalOtHR += record.otHR;
          }

          // Count night shift days
          if (record.dnShift && record.dnShift.toLowerCase() === 'n') {
            nightShiftCount++;
          }

          // Count evening shift days
          if (record.dnShift && record.dnShift.toLowerCase() === 'e') {
            eveningShiftCount++;
          }

          // Count site comment days
          if (record.comment &&
            typeof record.comment === 'string' &&
            record.comment.trim().toLowerCase().startsWith('site')) {
            siteCommentCount++;
          }
        });
      }

      // Return metrics for this employee
      return {
        employeeId: employee.id,
        totalNetHR,
        totalOtHR,
        nightShiftCount,
        eveningShiftCount,
        siteCommentCount,
        absentCount
      };
    });
  }

  const employeeMetrics = calculateEmployeeMetrics(attendanceData);

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
    // for the employe totals
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
    handleUnlock,
    handleReset,
    sortEmployeesByCustomOrder
  };
};