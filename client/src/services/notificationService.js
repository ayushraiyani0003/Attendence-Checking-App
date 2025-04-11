import axios from 'axios';

// Base API URL from environment or default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const notificationService = {
  /**
   * Client-facing methods
   */
  // Get all active notifications for client display
  getActiveNotifications: async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications/client`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active notifications:', error);
      throw error;
    }
  },

  /**
   * Admin methods for header messages
   */
  // Get all header messages (admin dashboard)
  getAllHeaderMessages: async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications/header`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching header messages:', error);
      throw error;
    }
  },

  // Get only active header messages
  getActiveHeaderMessages: async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications/header/active`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active header messages:', error);
      throw error;
    }
  },

  // Create a new header message (admin only)
  createHeaderMessage: async (message) => {
    try {
      const response = await axios.post(`${API_URL}/notifications/header`, 
        { message },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating header message:', error);
      throw error;
    }
  },

  // Toggle header message active status (admin only)
  toggleHeaderMessageStatus: async (id) => {
    try {
      const response = await axios.patch(
        `${API_URL}/notifications/header/${id}/toggle`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error toggling header message status:', error);
      throw error;
    }
  },

  // Delete a header message (admin only)
  deleteHeaderMessage: async (id) => {
    try {
      const response = await axios.delete(
        `${API_URL}/notifications/header/${id}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting header message:', error);
      throw error;
    }
  },

  /**
   * Admin methods for popup messages
   */
  // Get all popup messages (admin dashboard)
  getAllPopupMessages: async () => {
    // console.log("this is caled in client side");
    
    try {
      const response = await axios.get(`${API_URL}/notifications/popup`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching popup messages:', error);
      throw error;
    }
  },

  // Get only active popup messages
  getActivePopupMessages: async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications/popup/active`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active popup messages:', error);
      throw error;
    }
  },

  // Get current popup messages (based on time)
  getCurrentPopupMessages: async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications/popup/current`);
      return response.data;
    } catch (error) {
      console.error('Error fetching current popup messages:', error);
      throw error;
    }
  },

  // Create a new popup message (admin only)
  createPopupMessage: async (popupData) => {
    try {
      const response = await axios.post(
        `${API_URL}/notifications/popup`,
        popupData,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating popup message:', error);
      throw error;
    }
  },

  // Toggle popup message active status (admin only)
  togglePopupMessageStatus: async (id) => {
    try {
      const response = await axios.patch(
        `${API_URL}/notifications/popup/${id}/toggle`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error toggling popup message status:', error);
      throw error;
    }
  },

  // Delete a popup message (admin only)
  deletePopupMessage: async (id) => {
    try {
      const response = await axios.delete(
        `${API_URL}/notifications/popup/${id}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting popup message:', error);
      throw error;
    }
  }
};

export default notificationService;