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
    const token = localStorage.getItem("token");
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
    // Get the token directly in this function to ensure it's included
    const token = localStorage.getItem("token");
    
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
    return {
      success: false,
      message: error.response?.data?.message || "Error uploading files",
      error: error.response?.data || error.message,
    };
  }
};
