// SimplifiedDatePicker.jsx
import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { DatePicker } from 'antd';
import { getYesterday } from "../../utils/constants";
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const PickerContainer = styled.div`
  margin: 10px;
  width: 300px;
`;

const SimplifiedDatePicker = ({ dateRange, setDateRange }) => {
  const [open, setOpen] = useState(false);

  // Ensure dateRange values are dayjs objects
  const dayjsDateRange = Array.isArray(dateRange) 
    ? dateRange.map(date => dayjs.isDayjs(date) ? date : dayjs(date))
    : [getYesterday(), getYesterday()];

  const handleChange = useCallback((dates) => {
    if (dates) {
      setDateRange(dates);
    }
    setOpen(false);
  }, [setDateRange]);

  return (
    <PickerContainer>
      <RangePicker
        value={dayjsDateRange}
        onChange={handleChange}
        style={{ width: '100%' }}
        allowClear={true}
        format="MMM D, YYYY"
        open={open}
        onOpenChange={(open) => setOpen(open)}
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