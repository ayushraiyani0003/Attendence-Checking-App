import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/constants';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Effect to check token and validate it if present
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user'); // Retrieve user info from localStorage
    if (token && userData) {
      // Set the token in axios headers
      axios.defaults.headers['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(userData)); // Parse user data from localStorage
      setIsAuthenticated(true); // Set the authentication state to true
      validateToken(); // Validate the token with the backend if needed
    } else {
      setLoading(false); // If no token or user, stop loading
      setIsAuthenticated(false); // User is not authenticated
    }
  }, []); // Empty dependency array means this effect runs only once, on mount

  const validateToken = async () => {
    try {
      const response = await axios.get('http://localhost:5003/api/auth/validate-token', { withCredentials: true });
      if (response.status === 200) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        logout();  // Token is invalid, log out the user
      }
    } catch (error) {
      console.error('Token validation failed', error);
      logout();  // If validation fails, log out the user
    } finally {
      setLoading(false);  // Stop loading after validation attempt
    }
  };
  

  const login = async (username, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        { username, password },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );
      const { token, user } = response.data;
      localStorage.setItem('authToken', token);  // Store token in localStorage
      localStorage.setItem('user', JSON.stringify(user));  // Store user in localStorage
      axios.defaults.headers['Authorization'] = `Bearer ${token}`;
      setUser(user);
      setIsAuthenticated(true); // Set user and authenticated state
    } catch (error) {
      console.error('Login failed', error.response || error.message);
      throw new Error('Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    axios.defaults.headers['Authorization'] = ''; // Clear the token
  };

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator until the state is determined
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
