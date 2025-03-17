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
        setMessage({
          text: response.message || "Error uploading files. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage({
        text: "Server error. Please try again later.",
        type: "error",
      });
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
