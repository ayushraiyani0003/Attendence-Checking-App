
import dayjs from 'dayjs';

// Define roles or any other constants you may need
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
};

// List of available pages
export const pageRedirect = {
  dashbaord: "/dashboard",
  employee: "/employee",
  settings: "/settings",
  upload: "/upload",
  userList: "/user-list",
};

// Utility functions for week calculation
export const getCurrentWeekInMonth = (date = new Date()) => {
  const day = date.getDate();
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  
  // Divide the month into exactly 5 chunks
  const daysPerWeek = Math.ceil(daysInMonth / 5);
  
  // Calculate which chunk the current day falls into
  return Math.min(Math.ceil(day / daysPerWeek), 5);
};

export const getTotalWeeksInMonth = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Calculate how many complete 7-day weeks fit in the month
  return Math.ceil(daysInMonth / 7);
};

export const getYesterday = () => {
  return dayjs().subtract(1, 'day').startOf('day');
};

 // Validation functions
 export const exceedsThreshold = (value) => {
  if (!value) return false;
  const numericValue = parseFloat(value);
  return !isNaN(numericValue) && Math.abs(numericValue) > 0.25; // 0.25 hours = 15 minutes
};

export const validateNetHR = (value) => {
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue <= 11;
};

export const validateOtHR = (value) => {
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue <= 15;
};

  // Format value for database update
  export const formatValue = (value, column) => {
    if (column === "netHR" || column === "otHR") {
      const parsedFloat = parseFloat(value);
      if (isNaN(parsedFloat)) return 0;
      
      // Check if it's a whole number
      if (parsedFloat % 1 === 0) {
        return Math.floor(parsedFloat).toString(); // Return as integer
      } else {
        return parsedFloat.toString(); // Return with decimal intact
      }
    }
    return value;
  };

  // Calculate shift class for CSS styling
  export const getShiftClass = (shift) => {
    if (!shift) return "";
    const upperShift = shift.toUpperCase();
    if (upperShift === "D") return "dnShift-Day";
    if (upperShift === "N") return "dnShift-Night";
    if (upperShift === "E") return "dnShift-AfterNoon";
    return "";
  };

  export const canEdit = (attendance, isAdmin, isShowMetrixData) => {
    if (!attendance) return false;
    // Check if the record is unlocked
    const isUnlocked = attendance.lock_status === "unlocked";
    // Admin can edit if unlocked and not in metrix view
    if (isAdmin) {
      return isUnlocked && !isShowMetrixData;
    }
    // Non-admin users can edit if the record is unlocked
    return isUnlocked;
  };
