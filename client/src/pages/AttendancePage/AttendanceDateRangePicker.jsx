import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { DatePicker, Button, Space } from 'antd';
import { getYesterday } from "../../utils/constants";
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

// Styled components for consistent styling
const PickerContainer = styled.div`
  margin: 10px;
  width: 300px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 8px;
  background-color: #f5f5f5;
  border-top: 1px solid #d9d9d9;
`;

/**
 * AttendanceDateRangePicker - Optimized date picker with OK button functionality
 * - Prevents auto-closing when both dates are selected
 * - Only closes on explicit OK button click
 * - Defaults to yesterday if no range is selected
 * 
 * @param {Array} dateRange - Array containing [startDate, endDate] as dayjs objects or date strings
 * @param {Function} setDateRange - Function to update the date range in parent component
 * @returns {React.Component} Date range picker component
 */
const AttendanceDateRangePicker = ({ dateRange, setDateRange }) => {
  // State for controlling the picker's open/close state
  const [open, setOpen] = useState(false);
  
  // Temporary state to store dates before confirmation
  const [tempDates, setTempDates] = useState(null);
  
  // Ref to store the original onChange handler from RangePicker
  const originalOnChangeRef = useRef(null);

  // Get yesterday as dayjs object for consistent usage
  const yesterday = useMemo(() => getYesterday(), []);

  // Memoize date conversion to dayjs objects
  const dayjsDateRange = useMemo(() => {
    // Handle null or invalid dateRange
    if (!dateRange || !Array.isArray(dateRange) || dateRange.length !== 2) {
      return [yesterday, yesterday];
    }
    
    // Convert dates to dayjs objects if needed
    return [
      dateRange[0] ? (dayjs.isDayjs(dateRange[0]) ? dateRange[0] : dayjs(dateRange[0])) : yesterday,
      dateRange[1] ? (dayjs.isDayjs(dateRange[1]) ? dateRange[1] : dayjs(dateRange[1])) : yesterday
    ];
  }, [dateRange, yesterday]);

  // Effect to clear temp dates when opening the picker
  useEffect(() => {
    if (open) {
      // Clear previous selection when opening the picker
      setTempDates(null);
    }
  }, [open]);

  // Handle OK button click - apply the selected dates or use yesterday
  const handleOk = useCallback(() => {
    // If no date range is selected, use yesterday for both
    if (!tempDates || !tempDates[0] || !tempDates[1]) {
      setDateRange([yesterday, yesterday]);
    } else {
      setDateRange(tempDates);
    }
    setOpen(false);
    setTempDates(null);
  }, [tempDates, setDateRange, yesterday]);
  
  // Handle Cancel button click - reset to yesterday's date
  const handleCancel = useCallback(() => {
    // Reset to yesterday for both start and end dates
    setDateRange([yesterday, yesterday]);
    setOpen(false);
    setTempDates(null);
  }, [setDateRange, yesterday]);
  
  // Handle picker open/close state
  const handleOpenChange = useCallback((openState) => {
    // Always keep open if trying to close and we have any temp dates
    // This prevents auto-closing after selecting the second date
    if (!openState && tempDates) {
      return;
    }
    
    setOpen(openState);
    
    // If closing without any selection, set to yesterday
    if (!openState && (!tempDates || !tempDates[0] || !tempDates[1])) {
      setDateRange([yesterday, yesterday]);
    }
  }, [tempDates, setDateRange, yesterday]);

  // Handle date selection - just store temporarily
  const handleChange = useCallback((dates) => {
    setTempDates(dates);
    // Important: Don't close the picker here, regardless of selection state
  }, []);

  // Handle panel change to prevent auto-closing
  const handlePanelChange = useCallback((value, mode) => {
    // Do nothing, just prevent default behavior
  }, []);

  // Custom footer with OK and Cancel buttons
  const renderExtraFooter = useCallback(() => {
    // OK is always enabled - if no dates selected, it will use yesterday
    return (
      <ButtonContainer>
        <Space>
          <Button size="small" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            size="small" 
            onClick={handleOk}
          >
            OK
          </Button>
        </Space>
      </ButtonContainer>
    );
  }, [handleOk, handleCancel]);

  // Memoize styles to prevent object recreation
  const pickerStyle = useMemo(() => ({ width: '100%' }), []);

  // Value to display in the picker - show the temp dates if available, otherwise show dayjsDateRange
  // When open and nothing selected yet, show empty to encourage new selection
  const displayValue = useMemo(() => {
    if (open && (!tempDates || tempDates.length === 0)) {
      return undefined; // Show placeholder when open and nothing selected yet
    }
    return tempDates || dayjsDateRange;
  }, [open, tempDates, dayjsDateRange]);

  return (
    <PickerContainer>
      <RangePicker
        value={displayValue}
        onChange={handleChange}
        style={pickerStyle}
        allowClear={false} // Don't allow clearing - we always want a date
        format="MMM D, YYYY"
        open={open}
        onOpenChange={handleOpenChange}
        renderExtraFooter={renderExtraFooter}
        onCalendarChange={(dates) => {
          // Just store the dates, don't close
          setTempDates(dates);
        }}
        // CRITICAL: These handlers prevent auto-closing when dates are selected
        onPanelChange={handlePanelChange}  
        onOk={() => false} // Prevent built-in OK behavior
        onSelect={() => {}} // Prevent selection from auto-closing
        showOk={false} // Hide built-in OK button
        // Performance optimizations
        getPopupContainer={triggerNode => triggerNode.parentNode || document.body}
        popupStyle={{ animationDuration: '0s' }}
        // Placeholder when open with no selection
        placeholder={['Select start date', 'Select end date']}
        // Most important: Prevent closing on selection
        // This is a direct override of the RangePicker's internal behavior
        dropdownClassName="prevent-auto-close-picker"
      />
    </PickerContainer>
  );
};

// Add display name for debugging
AttendanceDateRangePicker.displayName = 'AttendanceDateRangePicker';

// Optimize rendering with custom comparison
export default React.memo(AttendanceDateRangePicker, (prevProps, nextProps) => {
  // Custom comparison for date ranges
  if (!prevProps.dateRange || !nextProps.dateRange) return false;
  
  const prevStart = prevProps.dateRange[0];
  const prevEnd = prevProps.dateRange[1];
  const nextStart = nextProps.dateRange[0];
  const nextEnd = nextProps.dateRange[1];
  
  // Compare dates - handle both object identity and dayjs value equality
  const startEqual = prevStart && nextStart && 
    (prevStart === nextStart || 
    (dayjs.isDayjs(prevStart) && dayjs.isDayjs(nextStart) && prevStart.isSame(nextStart)));
  
  const endEqual = prevEnd && nextEnd && 
    (prevEnd === nextEnd || 
    (dayjs.isDayjs(prevEnd) && dayjs.isDayjs(nextEnd) && prevEnd.isSame(nextEnd)));
  
  // Return true if dates and setter function are the same (prevents re-render)
  return startEqual && endEqual && prevProps.setDateRange === nextProps.setDateRange;
});