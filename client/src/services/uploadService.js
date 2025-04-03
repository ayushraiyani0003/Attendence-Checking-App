import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken"); // CHANGE: "token" to "authToken" to match your Auth context
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Upload attendance files to server
 * @param {FormData} formData - Form data with files and month-year
 * @returns {Promise} Response with status and message
 */
export const uploadFiles = async (formData) => {
  try {
    // CHANGE: Get the token with the correct key name
    const token = localStorage.getItem("authToken");
    
    const response = await apiClient.post("/metrics/upload-metrics", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        // Include the Authorization header explicitly
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
    });
    return response.data;
  } catch (error) {
    console.error("Upload error:", error);
    
    // More specific error handling for 401 Unauthorized
    if (error.response && error.response.status === 401) {
      return {
        success: false,
        message: "Authentication failed. Please log in again.",
        error: error.response?.data || error.message,
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || "Error uploading files",
      error: error.response?.data || error.message,
    };
  }
};