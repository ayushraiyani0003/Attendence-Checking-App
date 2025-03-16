// src/components/Button/Button.js
import React from 'react';
import styles from './Button.module.css';

const CustomButton = ({ onClick, children }) => {
  return (
    <button className={styles.button} onClick={onClick}>
      {children}
    </button>
  );
};

export default CustomButton;
