import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { getAttendanceLogs } from '../services/attendanceLogService';

// Helper function to get yesterday's date in YYYY-MM-DD format
const getYesterdayDateString = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

// Create the context
const AttendanceLogContext = createContext();

// Create a provider component
export const AttendanceLogProvider = ({ children }) => {
  // Initialize with yesterday's date instead of today
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getYesterdayDateString());

  // Fetch logs on initial load
  useEffect(() => {
    fetchLogs(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch logs for a specific date
  const fetchLogs = useCallback(async (date) => {
    try {
      setLoading(true);
      setError(null);
      
      // Update the selected date
      if (date) {
        setSelectedDate(date);
      }
      
      // Use the provided date or the current selected date
      const dateToFetch = date || selectedDate;
      
      // Call the service function
      const response = await getAttendanceLogs(dateToFetch);
      
      // Update state with the fetched data
      setLogs(response.data || []);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance logs');
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Filter logs by employee ID
  const filterLogsByEmployee = useCallback((employeeId) => {
    if (!employeeId) return logs;
    return logs.filter(log => log.employee_id === employeeId);
  }, [logs]);

  // Filter logs by department
  const filterLogsByDepartment = useCallback((department) => {
    if (!department) return logs;
    return logs.filter(log => log.employee_department === department);
  }, [logs]);

  // Get a summary of changes by field
  const getChangesSummary = useCallback(() => {
    if (!logs.length) return {};
    
    return logs.reduce((summary, log) => {
      const field = log.field;
      if (!summary[field]) {
        summary[field] = 0;
      }
      summary[field]++;
      return summary;
    }, {});
  }, [logs]);

  // Value to be provided to consumers
  const value = {
    logs,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    fetchLogs,
    filterLogsByEmployee,
    filterLogsByDepartment,
    getChangesSummary,
  };

  return (
    <AttendanceLogContext.Provider value={value}>
      {children}
    </AttendanceLogContext.Provider>
  );
};

// Custom hook for using this context
export const useAttendanceLogs = () => {
  const context = useContext(AttendanceLogContext);
  if (!context) {
    throw new Error('useAttendanceLogs must be used within an AttendanceLogProvider');
  }
  return context;
};