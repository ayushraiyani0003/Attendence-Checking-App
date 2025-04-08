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
    
    // Make the API request with the correct response type for file downloads
    const response = await axios.get(`${API_URL}/dashboard/reports`, {
      params,
      responseType: 'blob' // Important for file downloads
    });
    
    // Check if the response is a file (Excel document or ZIP)
    const contentType = response.headers['content-type'];
    const contentDisposition = response.headers['content-disposition'];
    
    // Check for both Excel and ZIP file types
    const isExcelFile = contentType && contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const isZipFile = contentType && contentType.includes('application/zip');
    
    if (isExcelFile || isZipFile) {
      // Get filename from content-disposition header provided by the backend
      let filename = isZipFile ? 'reports.zip' : 'report.xlsx'; // Default fallback filename
      let fileExtension = isZipFile ? '.zip' : '.xlsx';
      
      if (contentDisposition) {
        // Extract filename using regex pattern - this gets the filename sent from the backend
        // This pattern handles both quoted and unquoted filenames in the Content-Disposition header
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = contentDisposition.match(filenameRegex);
        if (matches && matches[1]) {
          // Remove any surrounding quotes and trim whitespace
          filename = matches[1].replace(/['"]/g, '').trim();
          console.log("Using backend-provided filename:", filename);
        } else {
          // Try a simpler approach if the regex doesn't match
          const parts = contentDisposition.split('filename=');
          if (parts.length > 1) {
            filename = parts[1].replace(/['"]/g, '').trim();
            console.log("Using extracted filename:", filename);
          } else {
            console.log("Could not extract filename from content-disposition header:", contentDisposition);
          }
        }
      } else {
        console.log("No content-disposition header found, using default filename");
        
        // If no content-disposition header is found, construct a filename based on the parameters
        const cleanReportType = reportType.toLowerCase().replace(/\s+/g, '_');
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        filename = `${cleanReportType}_${employeeType}_${formattedDate}${fileExtension}`;
        console.log("Generated fallback filename:", filename);
      }
      
      // Create a blob URL with the appropriate content type
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      link.style.display = 'none'; // Hide the link
      document.body.appendChild(link);
      
      // Trigger download without opening a new tab
      link.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
      
      return {
        success: true,
        message: `Downloaded ${isZipFile ? 'zip archive' : 'report'}: ${filename}`,
        isFile: true
      };
    }
    
    // If not a file, treat as regular JSON response
    // Parse the blob back to JSON
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        try {
          const jsonResponse = JSON.parse(reader.result);
          resolve(jsonResponse.data || []);
        } catch (error) {
          reject(new Error('Invalid response format'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading response'));
      reader.readAsText(response.data);
    });
    
  } catch (error) {
    console.error("Error fetching dashboard reports:", error);
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.data instanceof Blob) {
        // Try to parse error blob as JSON
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onload = () => {
            try {
              const jsonError = JSON.parse(reader.result);
              console.error("Server error details:", jsonError);
              reject(new Error(jsonError.message || "Error generating report"));
            } catch (parseError) {
              reject(new Error("Unknown server error"));
            }
          };
          reader.onerror = () => reject(new Error("Error reading error response"));
          reader.readAsText(error.response.data);
        });
      } else if (error.response.data) {
        console.error("Server error details:", error.response.data);
        throw new Error(error.response.data.message || "Error generating report");
      }
    }
    throw error;
  }
};