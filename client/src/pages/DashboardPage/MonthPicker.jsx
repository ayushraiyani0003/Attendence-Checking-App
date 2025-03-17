// src/components/MonthPicker/MonthPicker.js
import React from 'react';
import styles from './MonthPicker.module.css';

const MonthPicker = () => {
  return (
    <div className={styles.monthPicker}>
      <label>Select Month:</label>
      <select className={styles.monthSelect}>
        <option value="January">January</option>
        <option value="February">February</option>
        <option value="March">March</option>
        <option value="April">April</option>
        <option value="May">May</option>
        <option value="June">June</option>
        {/* Add other months */}
      </select>
    </div>
  );
};

export default MonthPicker;
