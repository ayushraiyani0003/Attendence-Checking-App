import React from 'react';
import styles from './Dashboard.module.css';
import ReportDownload from './ReportDownload';

const DashboardPage = () => {
  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboard}>
        <div className={styles.section}>
          <h3>Department-wise Mistakes</h3>
          {/* You can replace this with your chart or data representation */}
          <div className={styles.chart}>[Chart Here]</div>
        </div>
        <div className={styles.section}>
          <h3>Group-wise Mistakes</h3>
          {/* You can replace this with another chart or graph */}
          <div className={styles.chart}>[Chart Here]</div>
        </div>
        {/* Additional Metrics can go here */}
      </div>
      <div className={styles.sidePanel}>
        <ReportDownload />
      </div>
    </div>
  );
};

export default DashboardPage;