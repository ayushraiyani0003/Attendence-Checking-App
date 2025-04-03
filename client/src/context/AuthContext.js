import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import CustomLoader from "../assets/loader.svg";
const API_URL = process.env.REACT_APP_API_URL;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  // console.log(API_URL);
  
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);  // Added role for user/admin
  const [groupName, setGroupName] = useState("");  // Added groupName for filtering attendance by group

  // Set up axios interceptor to add token to all requests
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

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
          const user = response.data.user;
          setUser(user);
          setUserRole(user.role);  // Store role (admin/user)
          setGroupName(user.groupNames || []); // Always store as array

          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
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

      const { token, user } = response.data;

      // Store token and user in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Set token for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      setUserRole(user.role);  // Set role
      setGroupName(user.groupNames || []); // Always store as array
  // Set group name
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    // Remove token from axios headers
    delete axios.defaults.headers.common['Authorization'];

    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    // Update state
    setIsAuthenticated(false);
    setUser(null);
    setUserRole(null);
    setGroupName("");
  };

  if (loading) {
    return <div><img href={CustomLoader} /></div>;
  }

  return (
    <AuthContext.Provider value={{ user, userRole, groupName, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
