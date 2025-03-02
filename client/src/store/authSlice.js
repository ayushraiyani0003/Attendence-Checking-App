import { createSlice } from '@reduxjs/toolkit';

// Initial state based on localStorage or a default state
const initialState = {
  isAuthenticated: !!localStorage.getItem('authToken'), // Check if token exists in localStorage
  user: JSON.parse(localStorage.getItem('user')) || null, // Retrieve the user details from localStorage
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload; // Store the user details
      localStorage.setItem('authToken', action.payload.token); // Save token to localStorage
      localStorage.setItem('user', JSON.stringify(action.payload)); // Save user details to localStorage
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      localStorage.removeItem('authToken'); // Remove token from localStorage
      localStorage.removeItem('user'); // Remove user details from localStorage
    },
    setAuthentication: (state, action) => {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.user = action.payload.user;
    },
  },
});

export const { login, logout, setAuthentication } = authSlice.actions;

export default authSlice.reducer;
