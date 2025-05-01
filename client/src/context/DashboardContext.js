import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

// Create Dashboard Context
const DashboardContext = createContext();

/**
 * Custom hook to use the Dashboard Context
 * @returns {Object} The Dashboard context values
 */
export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
};

/**
 * Dashboard Provider Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Provider component
 */
export const DashboardProvider = ({ children }) => {
  // Get current month in "MMM YYYY" format
  const getCurrentMonth = useCallback(() => {
    const date = new Date();
    // If today is the 1st, move to previous month
    if (date.getDate() === 1) {
      date.setMonth(date.getMonth() - 1);
    }
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }, []);
  

  // State for selected month
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  
  // Recent reports history
  const [recentReports, setRecentReports] = useState([]);
  
  // Dashboard global settings
  const [settings, setSettings] = useState({
    refreshInterval: 0, // 0 means manual refresh only
    defaultView: 'Group',
    showSummary: true
  });

  // Update selected month
  const updateSelectedMonth = useCallback((newMonth) => {
    if (newMonth && typeof newMonth === 'string') {
      setSelectedMonth(newMonth);
    }
  }, []);

  // Add a report to recent reports history
  const addRecentReport = useCallback((report) => {
    setRecentReports(prev => {
      // Add new report to the beginning of the array
      const updated = [report, ...prev];
      // Limit to 5 recent reports
      return updated.slice(0, 5);
    });
  }, []);

  // Update dashboard settings
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);

  // Create context value
  const contextValue = {
    selectedMonth,
    updateSelectedMonth,
    recentReports,
    addRecentReport,
    settings,
    updateSettings
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

export default DashboardContext;