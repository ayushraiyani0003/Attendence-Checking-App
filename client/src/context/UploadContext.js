import React, { createContext, useContext, useState } from "react";
import { notification } from "antd";
import { uploadFiles } from "../services/uploadService"; // Import uploadFiles service

// Create a context for file uploads
const UploadContext = createContext();

// Custom hook to access the UploadContext
export const useUploadContext = () => {
  return useContext(UploadContext);
};

// Create a provider to wrap the application and provide file upload logic
export const UploadProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false); // Loading state during upload
  const [message, setMessage] = useState({ text: "", type: "" }); // Message state to display success or error messages

  // Function to handle file upload
  const handleFileUpload = async (formData) => {
    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await uploadFiles(formData); // Call the service to upload files

      if (response.success) {
        setMessage({
          text: "Files uploaded successfully! Processing attendance data.",
          type: "success",
        });
      } else {
        // Handle specific error messages from server
        setMessage({
          text: response.message || "Error uploading files. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
      
      // Initialize error message with a default
      let errorMessage = "Server error. Please try again later.";
      let errorDetails = "";
      
      // Check if there's a response object (typical of axios errors)
      if (error.response) {
        // console.log("Error response status:", error.response.status);
        // console.log("Error response data:", error.response.data);
        
        if (error.response.data) {
          // Extract specific error details if available
          if (error.response.data.error) {
            errorDetails = error.response.data.error;
            errorMessage = "File validation failed";
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          }
        }
      } else if (error.message) {
        // Direct error message
        errorMessage = error.message;
      }
      
      // Set error message in state
      setMessage({
        text: errorMessage,
        type: "error",
      });
      
      // Show notification with more details for validation errors
      if (
        (errorDetails && errorDetails.includes("file format error")) || 
        (errorMessage && errorMessage.includes("File validation failed"))
      ) {
        notification.error({
          message: "File Format Error",
          description: errorDetails || "Your Excel file has incorrect format. Please ensure it contains a 'User ID' column and properly formatted date columns.",
          duration: 10
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UploadContext.Provider
      value={{
        isLoading,
        message,
        handleFileUpload, // Expose the file upload handler to the context
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};