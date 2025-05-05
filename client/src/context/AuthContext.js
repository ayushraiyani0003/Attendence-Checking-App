import React, { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CustomLoader from "../assets/loader.svg";
const API_URL = process.env.REACT_APP_API_URL;

// Create AuthContext only once
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [groupName, setGroupName] = useState([]);

  // Session management
  const sessionIdRef = useRef(null);
  
  // Set up axios interceptor to add token to all requests
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Add beforeunload event listener to log out when tab/window is closed
    window.addEventListener('beforeunload', handleTabClose);
    
    // Add visibility change event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle tab close
  const handleTabClose = () => {
    if (isAuthenticated && sessionIdRef.current) {
      // Use synchronous methods for beforeunload event
      // Create a synchronous request
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}/auth/logout`, false); // false for synchronous
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Add authorization header if available
      const token = localStorage.getItem('authToken');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      // Send logout request
      xhr.send(JSON.stringify({ sessionId: sessionIdRef.current }));
      
      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionId');
    }
  };

  // Handle tab visibility changes - log out if tab becomes hidden
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden' && isAuthenticated) {
      logout();
    }
  };

  // Token validation on mount
  useEffect(() => {
    const validateAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/auth/validate-token`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 200) {
          const userData = response.data.user;
          setUser(userData);
          setUserRole(userData.role);
          
          // Ensure groupName is always an array
          if (userData.userReportingGroup && Array.isArray(userData.userReportingGroup)) {
            setGroupName(userData.userReportingGroup);
          } else {
            setGroupName([]);
          }

          // Store session ID for future reference
          if (response.data.sessionId) {
            sessionIdRef.current = response.data.sessionId;
            localStorage.setItem('sessionId', response.data.sessionId);
          }

          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('sessionId');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('sessionId');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    validateAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        { username, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { token, user, sessionId } = response.data;

      // Store token, user, and session ID in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('sessionId', sessionId);

      // Store session ID in ref for later use
      sessionIdRef.current = sessionId;

      // Set token for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      setUserRole(user.role);
      
      // Ensure groupName is always an array
      if (user.userReportingGroup && Array.isArray(user.userReportingGroup)) {
        setGroupName(user.userReportingGroup);
      } else {
        setGroupName([]);
      }

      setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      
      // Check if the error is because user is already logged in elsewhere
      if (error.response?.status === 409 && error.response.data?.alreadyLoggedIn) {
        throw new Error('You are already logged in on another device');
      }
      
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  // make it for continue on this device for fource login
  // make a try catch request to the server for the fource login with the body pass the fourceLogin True
  const forceLogin = async (username, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        { username, password, forceLogin: true },
        { headers: { 'Content-Type': 'application/json' } }
      );
  
      const { token, user, sessionId } = response.data;
  
      // Store token, user, and session ID in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('sessionId', sessionId);
  
      // Store session ID in ref for later use
      sessionIdRef.current = sessionId;
  
      // Set token for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
      setUser(user);
      setUserRole(user.role);
  
      // Ensure groupName is always an array
      if (user.userReportingGroup && Array.isArray(user.userReportingGroup)) {
        setGroupName(user.userReportingGroup);
      } else {
        setGroupName([]);
      }
  
      setIsAuthenticated(true);
  
      return true;
    } catch (error) {
      console.error('Force login failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Force login failed');
    }
  };
  

  const logout = async () => {
    try {
      // Notify server about logout
      await axios.post(`${API_URL}/auth/logout`, {
        sessionId: sessionIdRef.current
      }).catch(err => console.error('Error during logout:', err));

      // Clear session ID ref
      sessionIdRef.current = null;

      // Remove token from axios headers
      delete axios.defaults.headers.common['Authorization'];

      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionId');

      // Update state
      setIsAuthenticated(false);
      setUser(null);
      setUserRole(null);
      setGroupName([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return <div><img src={CustomLoader} alt="Loading..." /></div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRole, 
      groupName, 
      isAuthenticated, 
      login,
      forceLogin,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;