import React, { useState, useEffect } from 'react';
import ChangesHeader from './ChangesHeader';
import './AttendanceChangePage.css';
import { useAttendanceLogs } from '../../context/AttendanceLogContext';

const AttendanceChangePage = () => {
  // Use the context for logs, loading, error states and date management
  const {
    logs,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    fetchLogs
  } = useAttendanceLogs();

  // Local component state
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterReportingGroup, setFilterReportingGroup] = useState('all');

  // Fetch logs whenever the selected date changes
  useEffect(() => {
    if (selectedDate) {
      fetchLogs(selectedDate);
    }
  }, [selectedDate, fetchLogs]);

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedEmployee(null);
    setShowPopup(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDepartmentFilterChange = (e) => {
    setFilterDepartment(e.target.value);
  };

  const handleReportingGroupFilterChange = (e) => {
    setFilterReportingGroup(e.target.value);
  };

  const handleRowClick = (employee) => {
    setSelectedEmployee(employee);
    setShowPopup(true);
  };

  // Get unique employees for the selected date with filters applied
  const getUniqueEmployeesForDate = () => {
    // First, ensure we have logs before filtering
    if (!logs || logs.length === 0) {
      return [];
    }

    // Filter by selected date
    let filteredLogs = logs.filter(log => log.attendance_date === selectedDate);

    // Apply search filter - handle null/undefined safely
    if (searchTerm) {
      filteredLogs = filteredLogs.filter(log =>
        (log.employee_name && log.employee_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.employee_id !== undefined && String(log.employee_id).includes(searchTerm))
      );
    }

    // Apply department filter - handle null/undefined safely
    if (filterDepartment && filterDepartment !== 'all') {
      filteredLogs = filteredLogs.filter(log =>
        log.employee_department === filterDepartment
      );
    }

    // Apply reporting group filter - handle null/undefined safely
    if (filterReportingGroup && filterReportingGroup !== 'all') {
      filteredLogs = filteredLogs.filter(log =>
        log.employee_reporting_group === filterReportingGroup
      );
    }

    // Debug logs - remove in production
    // console.log("Applied filters:", {
    //   date: selectedDate,
    //   search: searchTerm,
    //   department: filterDepartment,
    //   reportingGroup: filterReportingGroup,
    //   resultCount: filteredLogs.length
    // });

    // Extract unique employees
    const uniqueEmployees = [];
    const seenIds = new Set();

    filteredLogs.forEach(log => {
      if (!seenIds.has(log.employee_id)) {
        seenIds.add(log.employee_id);
        uniqueEmployees.push({
          employee_id: log.employee_id,
          employee_name: log.employee_name,
          employee_department: log.employee_department,
          employee_reporting_group: log.employee_reporting_group,
          employee_punch_code: log.employee_punch_code,
          attendance_date: log.attendance_date
        });
      }
    });

    return uniqueEmployees;
  };

  // Get all changes for a specific employee on the selected date
  const getEmployeeChanges = (employeeId) => {
    return logs.filter(log =>
      log.employee_id === employeeId &&
      log.attendance_date === selectedDate
    );
  };

  // Close popup when close button is clicked or when clicking outside
  const closePopup = () => {
    setShowPopup(false);
    setSelectedEmployee(null);
  };

  // Handle outside click
  const handleOverlayClick = (e) => {
    // Only close if the click is directly on the overlay, not on its children
    if (e.target.classList.contains('popup-overlay')) {
      closePopup();
    }
  };

  // Get unique departments for filter options
  const getDepartments = () => {
    const departments = new Set();
    if (logs && logs.length > 0) {
      logs.forEach(log => {
        if (log.employee_department) {
          departments.add(log.employee_department);
        }
      });
    }
    return Array.from(departments);
  };

  // Get unique reporting groups for filter options
  const getReportingGroups = () => {
    const groups = new Set();
    if (logs && logs.length > 0) {
      logs.forEach(log => {
        if (log.employee_reporting_group) {
          groups.add(log.employee_reporting_group);
        }
      });
    }
    return Array.from(groups);
  };

  return (
    <div className="attendance-change-page">
      <ChangesHeader
        title="Attendance Change Logs"
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        departments={getDepartments()}
        reportingGroups={getReportingGroups()}
        filterDepartment={filterDepartment}
        onDepartmentFilterChange={handleDepartmentFilterChange}
        filterReportingGroup={filterReportingGroup}
        onReportingGroupFilterChange={handleReportingGroupFilterChange}
      />

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading attendance logs...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>Error: {error}</p>
          <button onClick={() => fetchLogs(selectedDate)}>
            Try Again
          </button>
        </div>
      ) : (
        <div className="attendance-table-container">
          <div className="table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Punch Code</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Reporting Group</th>
                  <th>Changes</th>
                </tr>
              </thead>
            </table>
            <div className="table-body-container">
              <table className="attendance-table">
                <tbody>
                  {getUniqueEmployeesForDate().map((employee) => {
                    const changeCount = getEmployeeChanges(employee.employee_id).length;
                    return (
                      <tr
                        key={employee.employee_id}
                        onClick={() => handleRowClick(employee)}
                      >
                        <td>{employee.employee_id}</td>
                        <td>{employee.employee_punch_code}</td>
                        <td>{employee.employee_name}</td>
                        <td>{employee.employee_department}</td>
                        <td>{employee.employee_reporting_group}</td>
                        <td>
                          <span className="change-badge">
                            {changeCount} {changeCount === 1 ? 'change' : 'changes'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {getUniqueEmployeesForDate().length === 0 && !loading && (
                    <tr>
                      <td colSpan="5" className="no-data">
                        <div className="empty-state">
                          <svg className="empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          <p>No attendance changes found for this date</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Popup Card */}
      {showPopup && selectedEmployee && (
        <div className="popup-overlay" onClick={handleOverlayClick}>
          <div className="popup-card">
            {/* Part 1: Header with name and close button */}
            <div className="popup-header">
              <h2>
                Attendance Changes: {selectedEmployee.employee_name}
              </h2>
              <button
                onClick={closePopup}
                className="close-button"
              >
                ✕
              </button>
            </div>

            {/* Part 2: Employee info in grid format */}
            <div className="employee-info">
              <div className="info-item">
                <p className="info-label">Employee Punch Code</p>
                <p className="info-value">{selectedEmployee.employee_punch_code || 'N/A'}</p>
              </div>
              <div className="info-item">
                <p className="info-label">Department</p>
                <p className="info-value">{selectedEmployee.employee_department}</p>
              </div>
              <div className="info-item">
                <p className="info-label">Reporting Group</p>
                <p className="info-value">{selectedEmployee.employee_reporting_group}</p>
              </div>
              <div className="info-item">
                <p className="info-label">Attendance Date</p>
                <p className="info-value">{selectedEmployee.attendance_date}</p>
              </div>
            </div>

            {/* Part 3: Changes table with responsive scrolling */}
            <h3 className="changes-title">Change History</h3>

            <div className="changes-table-container">
              <table className="changes-table">
                <thead>
                  <tr>
                    <th>Field Change</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                    <th>Changed By</th>
                    <th>Change Time</th>
                  </tr>
                </thead>
              </table>
              <div className="changes-table-body">
                <table className="changes-table">
                  <tbody>
                    {getEmployeeChanges(selectedEmployee.employee_id).length > 0 ? (
                      getEmployeeChanges(selectedEmployee.employee_id).map((change, index) => (
                        <tr key={`${change.log_id}-${index}`}>
                          <td className="field-cell">
                            {change.field.replace(/_/g, ' ')}
                          </td>
                          <td className="value-cell">
                            <span className="old-value" title={change.old_value}>{change.old_value}</span>
                          </td>
                          <td className="value-cell">
                            <span className="new-value" title={change.new_value}>{change.new_value}</span>
                          </td>
                          <td className="user-cell" title={change.changed_by}>
                            <div className="user-info">
                              {change.changed_by}
                            </div>
                          </td>
                          <td className="time-cell">{new Date(change.update_datetime).toLocaleTimeString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-changes-data">
                          <div className="empty-changes">
                            <svg className="empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="12"></line>
                              <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <p>No changes found for this employee</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceChangePage;