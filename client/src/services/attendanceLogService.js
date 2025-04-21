import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL;

/**
 * Retrieves attendance logs for a specific date
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {Promise<Object>} - The attendance logs data
 */
export const getAttendanceLogs = async (date) => {
  try {
    const response = await axios.get(`${API_URL}/attendance-logs`, {
      params: { date }
    });
    // console.log(response.data);
    return response.data;
    
  } catch (error) {
    console.error("Error fetching attendance logs:", error);
    throw error;
  }
};

/**
 * Exports attendance logs for a specific date
 * This is a placeholder function for future implementation
 * @param {string} date - The date in YYYY-MM-DD format
 * @param {string} format - Export format (e.g., 'csv', 'excel')
 * @returns {Promise<Blob>} - The exported file as a blob
 */
export const exportAttendanceLogs = async (date, format = 'csv') => {
  try {
    const response = await axios.get(`${API_URL}/attendance-logs/export`, {
      params: { date, format },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error("Error exporting attendance logs:", error);
    throw error;
  }
};