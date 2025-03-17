import { useState, useEffect } from "react";
import { getAttendanceByEmployee, addAttendance, editAttendance, getAttendanceByReportingGroup } from "../services/attendanceService"; // Assuming you have a service for API calls

const useAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch attendance by employee ID
  const fetchAttendanceByEmployee = async (employeeId) => {
    setIsLoading(true);
    try {
      const response = await getAttendanceByEmployee(employeeId); // Assuming you have an API service
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
      const response = await getAttendanceByReportingGroup(groupName, monthYear); // Assuming API for reporting group
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
      const response = await addAttendance(attendanceDetails); // Add attendance API service
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
      const response = await editAttendance(attendanceId, updatedDetails); // Update attendance API service
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

  // Additional functions to interact with the attendance data
  // For example, to calculate mistakes, lock/unlock attendance, etc.

  return {
    attendanceData,
    isLoading,
    error,
    fetchAttendanceByEmployee,
    fetchAttendanceByReportingGroup,
    createAttendance,
    updateAttendance,
  };
};

export default useAttendance;
