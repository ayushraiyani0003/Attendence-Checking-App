import React, { createContext, useContext, useState, useEffect } from "react";
import { getAttendanceByEmployee, addAttendance, editAttendance, getAttendanceByReportingGroup } from "../services/attendanceService"; // Assuming you have an API service for attendance

// Create Context
const AttendanceContext = createContext();

// Create a custom hook to use the attendance context
export const useAttendanceContext = () => {
  return useContext(AttendanceContext);
};

// AttendanceContextProvider component to wrap your app
export const AttendanceContextProvider = ({ children }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch attendance by employee ID
  const fetchAttendanceByEmployee = async (employeeId) => {
    setIsLoading(true);
    try {
      const response = await getAttendanceByEmployee(employeeId); // Call API to get data
      setAttendanceData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch attendance by reporting group and month/year
  const fetchAttendanceByReportingGroup = async (groupName, monthYear) => {
    setIsLoading(true);
    try {
      const response = await getAttendanceByReportingGroup(groupName, monthYear); // Call API for reporting group
      setAttendanceData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new attendance record
  const createAttendance = async (attendanceDetails) => {
    setIsLoading(true);
    try {
      const response = await addAttendance(attendanceDetails); // Call API to add attendance
      setAttendanceData((prevData) => [...prevData, response.data]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Edit an existing attendance record
  const updateAttendance = async (attendanceId, updatedDetails) => {
    setIsLoading(true);
    try {
      const response = await editAttendance(attendanceId, updatedDetails); // Call API to update attendance
      setAttendanceData((prevData) =>
        prevData.map((att) =>
          att.id === attendanceId ? { ...att, ...response.data } : att
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AttendanceContext.Provider
      value={{
        attendanceData,
        isLoading,
        error,
        fetchAttendanceByEmployee,
        fetchAttendanceByReportingGroup,
        createAttendance,
        updateAttendance,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};
