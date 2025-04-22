import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL;

/**
 * Creates a new attendance unlock request
 * @param {Object} requestData - The request data
 * @param {number} requestData.requestedById - User ID of the requester
 * @param {string} requestData.requestedBy - Name of the requester
 * @param {Object} requestData.requestedDateRange - Date range for which the attendance needs to be unlocked
 * @param {string} requestData.requestedDateRange.startDate - Start date (YYYY-MM-DD)
 * @param {string} requestData.requestedDateRange.endDate - End date (YYYY-MM-DD)
 * @param {string} requestData.requestReason - Reason for the request
 * @returns {Promise<Object>} - The created request data
 */
export const createUnlockRequest = async (requestData) => {
  try {
    // console.log(requestData);
    
    const response = await axios.post(`${API_URL}/attendance-unlock/create`, requestData);
    return response.data;
  } catch (error) {
    console.error("Error creating attendance unlock request:", error);
    throw error;
  }
};

/**
 * Updates the status of an attendance unlock request (approve/reject)
 * @param {number} requestId - ID of the request to update
 * @param {Object} statusData - Status update data
 * @param {string} statusData.status - New status ('approved' or 'rejected')
 * @param {string} statusData.statusBy - Name of the admin updating the status
 * @param {Object} statusData.dateRange - Date range for which the attendance was requested
 * @returns {Promise<Object>} - The updated request data
 */
export const updateRequestStatus = async (requestId, statusData) => {
  try {
    const response = await axios.put(`${API_URL}/attendance-unlock/update-status/${requestId}`, statusData);
    return response.data;
  } catch (error) {
    console.error("Error updating attendance unlock request status:", error);
    throw error;
  }
};

/**
 * Retrieves attendance unlock requests with optional filtering
 * @param {Object} filters - Optional filter parameters
 * @param {number} [filters.month] - Month (1-12)
 * @param {number} [filters.year] - Year (e.g., 2025)
 * @param {number} [filters.requestedById] - ID of the employee who made the request
 * @returns {Promise<Object>} - The filtered requests data
 */
export const getFilteredRequests = async (filters = {}) => {
  try {
    const response = await axios.get(`${API_URL}/attendance-unlock/filter`, {
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching attendance unlock requests:", error);
    throw error;
  }
};

/**
 * Helper function to format request data for display
 * @param {Array} requests - Array of request objects
 * @returns {Array} - Formatted request data
 */
export const formatRequestsForDisplay = (requests) => {
  if (!requests || !Array.isArray(requests)) return [];
  
  return requests.map(request => {
    // Handle date range format
    const dateRange = {
      startDate: request.requested_start_date || request.requested_date,
      endDate: request.requested_end_date || request.requested_date
    };
    
    return {
      id: request.request_id,
      employeeName: request.requested_by,
      dateRange: dateRange,
      reason: request.request_reason,
      status: request.status,
      requestedAt: new Date(request.requested_at).toLocaleString(),
      approvedBy: request.status_by || '',
      isPending: request.status === 'pending'
    };
  });
};