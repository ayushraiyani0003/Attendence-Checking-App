import React, { useState } from "react";
import axios from "axios";
import "./UploadPage.css";

function UploadPage() {
  const [zohoFiles, setZohoFiles] = useState([]);
  const [networkHourFile, setNetworkHourFile] = useState(null);
  const [otFile, setOtFile] = useState(null);
  const [monthYear, setMonthYear] = useState("");

  const handleSubmit = async () => {
    if (zohoFiles.length === 0 || !networkHourFile || !otFile || !monthYear) {
      alert("Please upload all files and enter month and year!");
      return;
    }

    const formData = new FormData();
    // Append the monthYear first
    formData.append("monthYear", monthYear);
    // Then append each Zoho file
    zohoFiles.forEach((file) => {
      formData.append("zohoFiles", file);
    });
    formData.append("networkHourFile", networkHourFile);
    formData.append("otFile", otFile);

    try {
      const response = await axios.post("http://localhost:5003/upload", formData);
      alert("Files uploaded successfully!");
      console.log(response.data);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("File upload failed!");
    }
  };

  return (
    <div className="main-container">
      
    <div className="upload-container">
      <h2>Upload Attendance Files</h2>

      <label className="form-group">Metrix Network Hour File</label>
      <input
        className="form-control"
        type="file"
        name="networkHourFile"
        onChange={(e) => setNetworkHourFile(e.target.files[0])}
        />

      <label className="form-group">Metrix OT File</label>
      <input
        className="form-control"
        type="file"
        name="otFile"
        onChange={(e) => setOtFile(e.target.files[0])}
        />

      <label className="form-group">Month &amp; Year</label>
      <input
        className="form-control"
        type="text"
        name="monthYear"
        placeholder="Dec 2024"
        value={monthYear}
        onChange={(e) => setMonthYear(e.target.value)}
        />

      <button className="btn btn-primary" onClick={handleSubmit}>
        Submit
      </button>
    </div>
        </div>
  );
}

export default UploadPage;
