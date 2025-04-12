import React, { useState } from "react";
import { useUploadContext } from "../../context/UploadContext"; // Use the context for uploading files
import "./UploadPage.css"; 

// Import sample files
import sampleNetworkFile from "../../assets/metrics_network.xlsx";
import sampleOTFile from "../../assets/metrics_OT_Report.xlsx";

function UploadPage() {
  const { handleFileUpload, message, isLoading } = useUploadContext(); // Get file upload logic and state from context
  const [networkHourFile, setNetworkHourFile] = useState(null);
  const [otFile, setOtFile] = useState(null);
  const [monthYear, setMonthYear] = useState("");

  // Handle file changes for network hour and OT files
  const handleFileChange = (e, setFile) => {
    setFile(e.target.files[0]);
  };

  // Handle month-year input change
  const handleMonthYearChange = (e) => {
    setMonthYear(e.target.value);
  };

  // Handle form submission for uploading files
  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("networkFile", networkHourFile);
    formData.append("otFile", otFile);
    formData.append("monthYear", monthYear);

    handleFileUpload(formData); // Call the file upload handler from context
  };

  return (
    <div className="main-container">
      <div className="upload-container">
        <div className="upload-header">
          <h2>Upload Attendance Files</h2>
          <p className="upload-subtitle">
            Please upload all required files to process attendance data
          </p>
        </div>

        {/* Sample Files Section */}
        <div className="sample-files-section">
          <p className="sample-files-title">Need sample files? Download here:</p>
          <div className="sample-files-container">
            <a 
              href={sampleNetworkFile} 
              download="metrics_network_sample.xlsx"
              className="sample-file-btn"
            >
              <span className="sample-icon">📊</span>
              <span>Sample Network Hour File</span>
            </a>
            <a 
              href={sampleOTFile} 
              download="metrics_OT_Report_sample.xlsx"
              className="sample-file-btn"
            >
              <span className="sample-icon">📑</span>
              <span>Sample OT File</span>
            </a>
          </div>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <div className="form-section">
          {/* Metrix Network Hour File */}
          <div className="form-group">
            <label htmlFor="networkHourFile">
              <span className="label-text">Metrix Network Hour File</span>
              <span className="required">*</span>
            </label>
            <div className="file-input-container">
              <input
                className="form-control file-input"
                type="file"
                id="networkHourFile"
                name="networkHourFile"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => handleFileChange(e, setNetworkHourFile)}
              />
              <div className="file-input-text">
                {networkHourFile ? networkHourFile.name : "Select file"}
              </div>
            </div>
          </div>

          {/* Metrix OT File */}
          <div className="form-group">
            <label htmlFor="otFile">
              <span className="label-text">Metrix OT File</span>
              <span className="required">*</span>
            </label>
            <div className="file-input-container">
              <input
                className="form-control file-input"
                type="file"
                id="otFile"
                name="otFile"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => handleFileChange(e, setOtFile)}
              />
              <div className="file-input-text">
                {otFile ? otFile.name : "Select file"}
              </div>
            </div>
          </div>

          {/* Month-Year Picker */}
          <div className="form-group">
            <label htmlFor="monthYear">
              <span className="label-text">Month & Year</span>
              <span className="required">*</span>
            </label>
            <input
              type="month"
              id="monthYear"
              name="monthYear"
              className="form-control month-picker"
              value={monthYear}
              onChange={handleMonthYearChange}
              placeholder="YYYY-MM"
            />
            {monthYear && (
              <div className="selected-month">Selected: {monthYear}</div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            className={`btn btn-primary ${isLoading ? "loading" : ""}`}
            onClick={handleSubmit}
            disabled={isLoading || !networkHourFile || !otFile || !monthYear}
          >
            {isLoading ? "Uploading..." : "Upload Files"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;