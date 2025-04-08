import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

// Function to get dashboard graph data
export const getDashboardGraphs = async (month, year) => {
  try {
    // Create params object with month and year
    const params = {
      month,
      year
    };
    
    // Make the API request with the correct query parameters
    const response = await axios.get(`${API_URL}/dashboard/graphs`, { params });
    return response.data.data || []; // Return the data array from the response
  } catch (error) {
    console.error("Error fetching dashboard graphs:", error);
    // If there's a detailed error message from the server, log it
    if (error.response && error.response.data) {
      console.error("Server error details:", error.response.data);
    }
    throw error;
  }
};

// Function to get dashboard reports (admin only) with configuration support
export const getReports = async (reportType, options, month, year, dateRange, employeeType) => {
  try {
    // Create params object with all the parameters
    const params = {
      reportType,
      options,
      month,
      year,
      dateRange,
      employeeType
    };
    
    // Make the API request with the correct query parameters
    const response = await axios.get(`${API_URL}/dashboard/reports`, { params });
    
    // If the server returns a download URL, handle it
    if (response.data.downloadUrl) {
      // Trigger file download
      window.open(response.data.downloadUrl, '_blank');
      
      // Return a success message
      return [{
        success: true,
        message: "Report download initiated",
        timestamp: new Date().toISOString()
      }];
    }
    
    return response.data.data || []; // Return the data array from the response
  } catch (error) {
    console.error("Error fetching dashboard reports:", error);
    // If there's a detailed error message from the server, log it
    if (error.response && error.response.data) {
      console.error("Server error details:", error.response.data);
    }
    throw error;
  }
};