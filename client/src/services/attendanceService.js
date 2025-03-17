import axios from 'axios';

// Base API URL (you can replace this with your actual API URL)
const BASE_URL = "https://your-api-url.com/api/attendance";

// Helper function to get the attendance by employee ID
export const getAttendanceByEmployee = async (employeeId) => {
  try {
    const response = await axios.get(`${BASE_URL}/employee/${employeeId}`);
    return response.data;  // Returning the data from the response
  } catch (error) {
    console.error("Error fetching attendance by employee:", error);
    throw error;
  }
};

// Helper function to get the attendance by reporting group and month/year
export const getAttendanceByReportingGroup = async (groupName, monthYear) => {
  try {
    const response = await axios.get(`${BASE_URL}/reporting-group/${groupName}/month/${monthYear}`);
    return response.data;  // Returning the data from the response
  } catch (error) {
    console.error("Error fetching attendance by reporting group:", error);
    throw error;
  }
};

// Helper function to add new attendance record
export const addAttendance = async (attendanceDetails) => {
  try {
    const response = await axios.post(`${BASE_URL}/add`, attendanceDetails);
    return response.data;  // Returning the data from the response
  } catch (error) {
    console.error("Error adding attendance:", error);
    throw error;
  }
};

// Helper function to edit an existing attendance record
export const editAttendance = async (attendanceId, updatedDetails) => {
  try {
    const response = await axios.put(`${BASE_URL}/edit/${attendanceId}`, updatedDetails);
    return response.data;  // Returning the data from the response
  } catch (error) {
    console.error("Error editing attendance:", error);
    throw error;
  }
};

// Helper function to lock attendance record
export const lockAttendance = async (attendanceId, lockedBy) => {
  try {
    const response = await axios.put(`${BASE_URL}/lock/${attendanceId}`, { locked_by: lockedBy });
    return response.data;  // Returning the success message
  } catch (error) {
    console.error("Error locking attendance:", error);
    throw error;
  }
};

// Helper function to unlock attendance record
export const unlockAttendance = async (attendanceId, lockedBy) => {
  try {
    const response = await axios.put(`${BASE_URL}/unlock/${attendanceId}`, { locked_by: lockedBy });
    return response.data;  // Returning the success message
  } catch (error) {
    console.error("Error unlocking attendance:", error);
    throw error;
  }
};

// Helper function to get attendance lock/unlock status for a reporting group per month
export const getAttendanceStatusForReportingGroup = async (groupName, monthYear) => {
  try {
    const response = await axios.get(`${BASE_URL}/reporting-group-status/${groupName}/month/${monthYear}`);
    return response.data;  // Returning the lock/unlock status data
  } catch (error) {
    console.error("Error fetching attendance lock status:", error);
    throw error;
  }
};
