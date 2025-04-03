// src/components/ReportDownload/ReportDownload.js
import React, { useState } from 'react';
import MonthPicker from './MonthPicker';
import Button from './CustomButton';
import styles from './ReportDownload.module.css';

const ReportDownload = () => {
  const [isSeparated, setIsSeparated] = useState(false);

  const handleDownload = (reportType) => {
    // Implement the download logic here
    // console.log(`Downloading ${reportType} report with file format: ${isSeparated ? 'Separated' : 'Zipped'}`);
  };

  return (
    <div className={styles.reportDownload}>
      <MonthPicker />
      <div className={styles.buttons}>
        <Button onClick={() => handleDownload('New Emp')}>Only New Emp Data</Button>
        <Button onClick={() => handleDownload('Faulty Emp')}>Only Faulty Emp Data</Button>
        <Button onClick={() => handleDownload('All Emp')}>All Emp Total Data</Button>
      </div>
      <div className={styles.checkbox}>
        <label>
          <input type="checkbox" checked={isSeparated} onChange={() => setIsSeparated(!isSeparated)} />
          Is Separated or Zip?
        </label>
      </div>
      <button className={styles.downloadButton} onClick={() => handleDownload('All Emp')}>
        Download Report
      </button>
    </div>
  );
};

export default ReportDownload;
