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
    if (token) {
      axios.defaults.headers['Authorization'] = `Bearer ${token}`;
      // Optionally validate token by calling an endpoint to fetch user details
      validateToken();
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/validate-token`);
      if (response.status === 200) {
        console.log('User set to:', response.data.user);
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        logout(); // Token is invalid, log out the user
      }
    } catch (error) {
      console.error('Token validation failed', error);
      logout(); // If validation fails, log out the user
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    console.log('Login attempt with username:', username, 'and password:', password);
  
    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        { username, password },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );
      const { token, user } = response.data;
      localStorage.setItem('authToken', token);
      axios.defaults.headers['Authorization'] = `Bearer ${token}`;
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed', error.response || error.message);
      throw new Error('Login failed');  // Ensure the error is thrown for .catch() in LoginForm
    }
  };
  

  const logout = () => {
    localStorage.removeItem('authToken');
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
