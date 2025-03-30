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
