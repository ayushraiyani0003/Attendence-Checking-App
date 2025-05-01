import React, { useState } from 'react';
import styled from 'styled-components';
import { DatePicker } from 'antd';
import { getYesterday } from "../../utils/constants";
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const PickerContainer = styled.div`
  margin: 10px;
  width: 300px;
`;

const SimplifiedDatePicker = ({ dateRange, setDateRange, disabled = false }) => {
  const [open, setOpen] = useState(false);
  
  // Helper function to safely check if a date is valid
  const isValidDayjs = (date) => {
    // Check if it's a dayjs object first
    if (date && typeof date === 'object' && typeof date.isValid === 'function') {
      return date.isValid();
    }
    // If it's not a dayjs object, create one and check
    if (date) {
      return dayjs(date).isValid();
    }
    return false;
  };

  // Process dates before passing to the RangePicker
  const processedDateRange = Array.isArray(dateRange) ? 
    dateRange.map(date => (date && isValidDayjs(date) ? date : null)) : 
    null;

  // Safe onChange handler
  const handleDateChange = (dates) => {
    // Ensure both dates are valid before updating
    if (dates && dates.length === 2 && dates[0] && dates[1]) {
      setDateRange(dates);
    } else if (!dates) {
      // Clear the dates when user clicks clear button
      setDateRange(null);
    }
  };

  return (
    <PickerContainer>
      <RangePicker
        value={processedDateRange}
        onChange={handleDateChange}
        style={{ width: '100%' }}
        allowClear={true}
        format="MMM D, YYYY"
        open={open}
        onOpenChange={(open) => setOpen(open)}
        disabled={disabled}
        onCalendarChange={(dates) => {
          // Only update when both dates are selected
          if (dates && dates[0] && dates[1]) {
            setDateRange(dates);
          }
        }}
      />
    </PickerContainer>
  );
};

export default React.memo(SimplifiedDatePicker);