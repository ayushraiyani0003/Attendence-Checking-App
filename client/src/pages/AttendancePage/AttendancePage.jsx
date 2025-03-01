import React, { useState, useEffect, useRef } from "react";
import "./AttendancePage.css";
import AttendanceHeader from "./AttendanceHeader";
import DataRow from "./DataRow";

function AttendancePage() {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [editableCell, setEditableCell] = useState(null);
  const [data, setData] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [view, setView] = useState("all"); // 'all', 'day', 'night'
  const [hasChanges, setHasChanges] = useState(false); // Track if there are unsaved changes

  const isAdmin = true;
  const fixedColumns = [
    { key: "punchCode", label: "Punch Code" },
    { key: "name", label: "Name" },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
  ];

  // Mock data for demonstration
  const mockData = [
    {
      id: "1", // Added unique id
      punchCode: "001",
      name: "John Smith",
      designation: "Senior Developer",
      department: "Engineering",
      attendance: [
        {
          date: "03/10/2024",
          day: "Thursday",
          netHR: "8",
          otHR: "1",
          dnShift: "Day",
        },
        {
          date: "04/10/2024",
          day: "Friday",
          netHR: "7",
          otHR: "0",
          dnShift: "Day",
        },
      ],
    },
    {
      id: "2", // Added unique id
      punchCode: "002",
      name: "Sarah Johnson",
      designation: "Project Manager",
      department: "Product",
      attendance: [
        {
          date: "03/10/2024",
          day: "Thursday",
          netHR: "8",
          otHR: "2",
          dnShift: "Day",
        },
        {
          date: "04/10/2024",
          day: "Friday",
          netHR: "6",
          otHR: "0",
          dnShift: "Day",
        },
      ],
    },
    {
      id: "3", // Added unique id
      punchCode: "003",
      name: "Michael Chen",
      designation: "QA Engineer",
      department: "Engineering",
      attendance: [
        {
          date: "03/10/2024",
          day: "Thursday",
          netHR: "0",
          otHR: "0",
          dnShift: "Off",
        },
        {
          date: "04/10/2024",
          day: "Friday",
          netHR: "8",
          otHR: "4",
          dnShift: "Night",
        },
      ],
    },
    {
      id: "4", // Added unique id
      punchCode: "004",
      name: "Emily Rodriguez",
      designation: "UX Designer",
      department: "Design",
      attendance: [
        {
          date: "03/10/2024",
          day: "Thursday",
          netHR: "7",
          otHR: "1",
          dnShift: "Day",
        },
        {
          date: "04/10/2024",
          day: "Friday",
          netHR: "8",
          otHR: "2",
          dnShift: "Night",
        },
      ],
    },
  ];

  // Function to add a new employee
  const addNewEmployee = () => {
    const newEmployee = {
      id: `${data.length + 1}`, // Added unique id
      punchCode: `00${data.length + 1}`,
      name: "New Employee",
      designation: "Staff",
      department: "Department",
      attendance:
        data[0]?.attendance.map((att) => ({
          ...att,
          netHR: "0",
          otHR: "0",
          dnShift: "Day",
        })) || [],
    };
    setData((prevData) => [...prevData, newEmployee]);
    setHasChanges(true);
  };

  // Function to add a new day column for all employees
  const addNewDay = () => {
    // Get the last date and increment by 1 day
    const lastDate = data[0]?.attendance[data[0].attendance.length - 1]?.date;

    if (!lastDate) return;

    const [month, day, year] = lastDate.split("/");
    const nextDate = new Date(year, month - 1, parseInt(day) + 1);
    const formattedDate = `${String(nextDate.getMonth() + 1).padStart(
      2,
      "0"
    )}/${String(nextDate.getDate()).padStart(
      2,
      "0"
    )}/${nextDate.getFullYear()}`;

    // Get day of week
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = days[nextDate.getDay()];

    const updatedData = data.map((employee) => ({
      ...employee,
      attendance: [
        ...employee.attendance,
        {
          date: formattedDate,
          day: dayName,
          netHR: "0",
          otHR: "0",
          dnShift: "Day",
        },
      ],
    }));

    setData(updatedData);
    setHasChanges(true);
  };

  // Handle keyboard navigation
  const onKeyDown = (e, rowIndex, column) => {
    if (!column) return;

    const [field, columnIndex] = column.split("-");
    const colIndex = parseInt(columnIndex);

    if (e.key === "Tab") {
      e.preventDefault();
      // Determine next field in the same cell or move to next cell
      const fields = ["netHR", "otHR", "dnShift"];
      const currentFieldIndex = fields.indexOf(field);

      const filteredData = getFilteredData();
      const currentRowId = filteredData[rowIndex].id;
      const currentRowOriginalIndex = data.findIndex(
        (item) => item.id === currentRowId
      );

      if (currentFieldIndex < fields.length - 1) {
        // Move to next field in same cell
        setEditableCell({
          rowIndex: currentRowOriginalIndex,
          column: `${fields[currentFieldIndex + 1]}-${colIndex}`,
        });
      } else if (
        colIndex <
        data[currentRowOriginalIndex].attendance.length - 1
      ) {
        // Move to first field of next column
        setEditableCell({
          rowIndex: currentRowOriginalIndex,
          column: `${fields[0]}-${colIndex + 1}`,
        });
      } else if (rowIndex < filteredData.length - 1) {
        // Move to first field of first column of next row
        const nextRowId = filteredData[rowIndex + 1].id;
        const nextRowOriginalIndex = data.findIndex(
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
    } else if (e.key === "ArrowUp" && rowIndex > 0) {
      e.preventDefault();
      const filteredData = getFilteredData();
      const currentRowId = filteredData[rowIndex].id;
      const prevRowId = filteredData[rowIndex - 1].id;
      const prevRowOriginalIndex = data.findIndex(
        (item) => item.id === prevRowId
      );
      setEditableCell({ rowIndex: prevRowOriginalIndex, column });
    } else if (
      e.key === "ArrowDown" &&
      rowIndex < getFilteredData().length - 1
    ) {
      e.preventDefault();
      const filteredData = getFilteredData();
      const currentRowId = filteredData[rowIndex].id;
      const nextRowId = filteredData[rowIndex + 1].id;
      const nextRowOriginalIndex = data.findIndex(
        (item) => item.id === nextRowId
      );
      setEditableCell({ rowIndex: nextRowOriginalIndex, column });
    } else if (e.key === "ArrowLeft" && colIndex > 0) {
      e.preventDefault();
      const filteredData = getFilteredData();
      const currentRowId = filteredData[rowIndex].id;
      const currentRowOriginalIndex = data.findIndex(
        (item) => item.id === currentRowId
      );
      setEditableCell({
        rowIndex: currentRowOriginalIndex,
        column: `${field}-${colIndex - 1}`,
      });
    } else if (
      e.key === "ArrowRight" &&
      colIndex < data[rowIndex].attendance.length - 1
    ) {
      e.preventDefault();
      const filteredData = getFilteredData();
      const currentRowId = filteredData[rowIndex].id;
      const currentRowOriginalIndex = data.findIndex(
        (item) => item.id === currentRowId
      );
      setEditableCell({
        rowIndex: currentRowOriginalIndex,
        column: `${field}-${colIndex + 1}`,
      });
    }
  };

  // Filter and sort the data
  const getFilteredData = () => {
    let filteredData = [...data];

    // Apply text filter across all fields
    if (filterText) {
      const searchTerm = filterText.toLowerCase();
      filteredData = filteredData.filter((item) => {
        // Check all text fields
        const textMatch =
          item.name.toLowerCase().includes(searchTerm) ||
          item.punchCode.toLowerCase().includes(searchTerm) ||
          item.department.toLowerCase().includes(searchTerm) ||
          item.designation.toLowerCase().includes(searchTerm);

        // Check attendance data
        const attendanceMatch = item.attendance.some(
          (att) =>
            att.netHR.toLowerCase().includes(searchTerm) ||
            att.otHR.toLowerCase().includes(searchTerm) ||
            att.dnShift.toLowerCase().includes(searchTerm) ||
            att.date.toLowerCase().includes(searchTerm) ||
            att.day.toLowerCase().includes(searchTerm)
        );

        return textMatch || attendanceMatch;
      });
    }

    // Apply shift filter
    if (view !== "all") {
      filteredData = filteredData.filter((item) =>
        item.attendance.some(
          (att) => att.dnShift.toLowerCase() === view.toLowerCase()
        )
      );
    }

    // Apply sorting to any field including attendance data
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle sorting for attendance fields
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
    // Here you would typically make an API call to save the changes
    console.log("Saving changes:", data);
    setHasChanges(false);
  };

  // Load mock data on initial render
  useEffect(() => {
    setData(mockData);
  }, []);

  const filteredData = getFilteredData();

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

  const downloadReport = () => {
    console.log("Downloading Final file...");
  };

  return (
    <div className="attendance-page">
      <div className="attendance-container">
        {/* Controls Section */}
        <div className="attendance-controls">
          <div>
            <input
              type="text"
              placeholder="Search across all fields..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="search-input"
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                border: "1px solid var(--gray-300)",
                marginRight: "12px",
                width: "240px",
              }}
            />
            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                border: "1px solid var(--gray-300)",
                background: "white",
              }}
            >
              <option value="all">All Shifts</option>
              <option value="day">Day Shift</option>
              <option value="night">Night Shift</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            {isAdmin && (
              <>
                <button className="control-button" onClick={addNewDay}>
                  Add New Day
                </button>
                <button
                  className="control-button secondary"
                  onClick={addNewEmployee}
                >
                  Add Employee
                </button>
                <button
                  className="control-button secondary"
                  onClick={downloadReport}
                >
                  Download Report
                </button>
              </>
            )}
          {/* Save Changes Button */}
        {hasChanges && (
          
            <button
            className="control-button secondary"
            onClick={handleSaveChanges}
            >
              Save Changes
            </button>
        )}
          </div>
        </div>

        {/* Header Section */}
        <div className="header-wrapper" ref={headerRef}>
          {filteredData.length > 0 && filteredData[0].attendance && (
            <AttendanceHeader
              columns={filteredData[0].attendance}
              onSort={handleSort}
              sortConfig={sortConfig}
              fixedColumns={fixedColumns}
            />
          )}
        </div>

        {/* Empty State */}
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

        {/* Data Container */}
        <div className="data-container" ref={dataContainerRef}>
          {filteredData.map((row, rowIndex) => (
            <DataRow
              key={row.id}
              row={row}
              rowIndex={data.findIndex((item) => item.id === row.id)}
              hoveredRow={hoveredRow}
              setHoveredRow={setHoveredRow}
              editableCell={editableCell}
              setEditableCell={setEditableCell}
              data={data}
              setData={(newData) => {
                setData(newData);
                setHasChanges(true);
              }}
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
