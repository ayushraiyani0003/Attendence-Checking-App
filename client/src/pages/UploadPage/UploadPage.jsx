import React, { useState } from "react";
import "./UploadPage.css";

function UploadPage() {
  const [zohoFiles, setZohoFiles] = useState([]);
  const [networkHourFile, setNetworkHourFile] = useState(null);
  const [otFile, setOtFile] = useState(null);
  const [monthYear, setMonthYear] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubmit = async () => {
    if (zohoFiles.length === 0 || !networkHourFile || !otFile || !monthYear) {
      setMessage({ text: "Please upload all required files and enter month and year", type: "error" });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });
    
    const formData = new FormData();
    formData.append("monthYear", monthYear);
    zohoFiles.forEach((file) => {
      formData.append("zohoFiles", file);
    });
    formData.append("networkHourFile", networkHourFile);
    formData.append("otFile", otFile);

    try {
      const response = await fetch("http://localhost:5003/upload", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        setMessage({ text: "Files uploaded successfully!", type: "success" });
        // Reset form
        setZohoFiles([]);
        setNetworkHourFile(null);
        setOtFile(null);
        setMonthYear("");
        // Reset file inputs
        document.getElementById("zohoFiles").value = "";
        document.getElementById("networkHourFile").value = "";
        document.getElementById("otFile").value = "";
      } else {
        throw new Error("Server responded with an error");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      setMessage({ text: "File upload failed. Please try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleZohoFilesChange = (e) => {
    if (e.target.files) {
      setZohoFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="main-container">
      <div className="upload-container">
        <div className="upload-header">
          <h2>Upload Attendance Files</h2>
          <p className="upload-subtitle">Please upload all required files to process attendance data</p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="form-section">
          {/* <div className="form-group">
            <label htmlFor="zohoFiles">
              <span className="label-text">Zoho Files</span>
              <span className="required">*</span>
            </label>
            <div className="file-input-container">
              <input
                className="form-control file-input"
                type="file"
                id="zohoFiles"
                name="zohoFiles"
                multiple
                onChange={handleZohoFilesChange}
              />
              <div className="file-input-text">
                {zohoFiles.length > 0 
                  ? `${zohoFiles.length} file(s) selected` 
                  : "Select files"}
              </div>
            </div>
            {zohoFiles.length > 0 && (
              <div className="file-list">
                {zohoFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ))}
              </div>
            )}
          </div> */}

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
                onChange={(e) => setNetworkHourFile(e.target.files[0])}
              />
              <div className="file-input-text">
                {networkHourFile ? networkHourFile.name : "Select file"}
              </div>
            </div>
          </div>

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
                onChange={(e) => setOtFile(e.target.files[0])}
              />
              <div className="file-input-text">
                {otFile ? otFile.name : "Select file"}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="monthYear">
              <span className="label-text">Month & Year</span>
              <span className="required">*</span>
            </label>
            <input
              className="form-control"
              type="text"
              id="monthYear"
              name="monthYear"
              placeholder="e.g., Dec 2024"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            className={`btn btn-primary ${isLoading ? 'loading' : ''}`} 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Uploading..." : "Upload Files"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;