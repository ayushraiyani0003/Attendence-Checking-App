import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL;

// Get all users
export const getAllUsers = async () => {
  try {
    console.log('Fetching users from:', `${API_URL}/users`);
    const response = await axios.get(`${API_URL}/users`);
    console.log('Users response:', response.data); // No need to specify '/users' as it's already set in baseURL
    return response.data;  // Assuming the response is an array of users
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
};

// Create a new user
export const createUser = async (userData) => {
  try {
    console.log("userData", userData);
    const response = await axios.post(`${API_URL}/users/create`, userData); // Post request to create a user
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
};

// Update an existing user
export const updateUser = async (id, userData) => {
  try {
    const response = await axios.put(`${API_URL}/users/update/${id}`, userData); // Put request to update user with specific ID
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
};

// Delete a user
export const deleteUser = async (id) => {
  try {
    await axios.delete(`${API_URL}/users/delete/${id}`);  // Delete request for specific user by ID
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
};

// Service to get departments, designations, and reporting groups from the server
export const getStaticData = async () => {
  try {
    const response = await axios.get(`${API_URL}/setting/departments`);  // Replace with your API endpoint for departments
    return response.data;  // Assuming the response is an array of departments
  } catch (error) {
    throw new Error('Error fetching departments');
  }
};

