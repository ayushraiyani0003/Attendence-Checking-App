import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ResultPage.css";
import CustomSidebar from "../../components/Sidebar/CustomSidebar";
import CustomDropdown from "../../components/CustomDropdown/CustomDropdown";
import ResultContent from "../../components/ResultContent/ResultContent";

const departments = [
  { id: 1, name: "Sales" },
  { id: 2, name: "Marketing" },
  { id: 3, name: "Engineering" },
  { id: 4, name: "HR" },
];

const ResultPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthOptions, setMonthOptions] = useState([]);
  const [isProcessed, setIsProcessed] = useState(false);
  const [logData, setLogData] = useState("");

  // Fetch the available month/year values from the server on mount.
  useEffect(() => {
    const fetchMonths = async () => {
      try {
        const response = await axios.get("http://localhost:5003/months");
        // Convert each month string into an object for react-select.
        const months = response.data.map((month) => ({
          value: month,
          label: month,
        }));
        setMonthOptions(months);
      } catch (error) {
        console.error("Error fetching months:", error);
      }
    };
    fetchMonths();
  }, []);

  // Callback for processing data when user clicks "Process Data"
  const handleProcessData = async () => {
    if (!selectedMonth) {
      alert("Please select a month before processing data.");
      return;
    }
    // Start processing: update log and reset processed state.
    setLogData("Processing has started...\n");
    setIsProcessed(false);

    try {
      // Updated URL: ensure it matches your server route.
      const response = await axios.post("http://localhost:5003/process/processFiles", {
        month: selectedMonth.value,
      });
      // Assume the server returns a log string.
      setLogData(response.data.log);
      setIsProcessed(true);
    } catch (error) {
      console.error("Error processing files:", error);
      setLogData("Error processing files: " + error.message);
    }
  };

  return (
    <div className="result-page">
      {/* Sidebar */}
      <CustomSidebar departments={departments} />

      {/* Main Content */}
      <main className="main-content">
        <CustomDropdown
          monthOptions={monthOptions}
          setSelectedMonth={setSelectedMonth}
          onProcess={handleProcessData}
        />

        <div className="content-display">
          {!isProcessed ? (
            <div className="process-log">
              <h4>Process Log</h4>
              <pre>{logData}</pre>
            </div>
          ) : (
            <div className="result">
              <ResultContent />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResultPage;
