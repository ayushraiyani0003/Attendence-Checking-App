import { useState } from "react";
import { notification } from "antd";
import { uploadFiles } from "../services/uploadService"; // File upload service

export const useUploadFiles = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleFileUpload = async (formData) => {
    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await uploadFiles(formData);

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

  return { handleFileUpload, message, isLoading };
};
