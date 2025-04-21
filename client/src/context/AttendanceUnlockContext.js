import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { 
  getFilteredRequests, 
  createUnlockRequest, 
  updateRequestStatus,
  formatRequestsForDisplay
} from '../services/attendanceUnlockService';

// Helper function to get current month and year
const getCurrentMonthYear = () => {
  const date = new Date();
  return {
    month: date.getMonth() + 1, // JavaScript months are 0-indexed
    year: date.getFullYear()
  };
};

// Create the context
const AttendanceUnlockContext = createContext();

// Create a provider component
export const AttendanceUnlockProvider = ({ children }) => {
  // State for requests data
  const [requests, setRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    ...getCurrentMonthYear(),
    requestedById: null
  });

  // Fetch requests on initial load and when filters change
  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Fetch requests with current filters
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the service function with current filters
      const response = await getFilteredRequests(filters);
      
      // Format the data for display
      const formattedRequests = formatRequestsForDisplay(response.data || []);
      
      // Update the main requests state
      setRequests(formattedRequests);
      
      // Split into pending and approved/rejected for easy access
      setPendingRequests(formattedRequests.filter(req => req.status === 'pending'));
      setApprovedRequests(formattedRequests.filter(req => req.status !== 'pending'));
      
      return formattedRequests;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance unlock requests');
      return [];
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Submit a new unlock request
  const submitRequest = useCallback(async (requestData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the service function to create a new request
      const response = await createUnlockRequest(requestData);
      
      // Refresh the requests list
      await fetchRequests();
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit attendance unlock request');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRequests]);

  // Approve or reject a request
  const handleRequestStatus = useCallback(async (requestId, status, statusBy, user, date) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the service function to update request status
      const response = await updateRequestStatus(requestId, { status, statusBy, user, date });
      
      // Refresh the requests list
      await fetchRequests();
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${status} attendance unlock request`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRequests]);

  // Update filter values
  const updateFilters = useCallback((newFilters) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);

  // Value to be provided to consumers
  const value = {
    requests,
    pendingRequests,
    approvedRequests,
    loading,
    error,
    filters,
    updateFilters,
    fetchRequests,
    submitRequest,
    handleRequestStatus
  };

  return (
    <AttendanceUnlockContext.Provider value={value}>
      {children}
    </AttendanceUnlockContext.Provider>
  );
};

// Custom hook for using this context
export const useAttendanceUnlock = () => {
  const context = useContext(AttendanceUnlockContext);
  if (!context) {
    throw new Error('useAttendanceUnlock must be used within an AttendanceUnlockProvider');
  }
  return context;
};