// services/sessionService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const sessionService = {
  // Delete all sessions
  deleteAllSessions: async () => {
    const response = await axios.delete(`${API_URL}/sessions`);
    return response.data;
  },
  
  // Delete sessions for a specific user
  deleteUserSessions: async (userId) => {
    const response = await axios.delete(`${API_URL}/sessions/?userId=${userId}`);
    return response.data;
  },
  
  // Delete inactive sessions
  deleteInactiveSessions: async () => {
    const response = await axios.delete(`${API_URL}/sessions/?inactive=true`);
    return response.data;
  },
  
  // Delete sessions older than a week
  deleteOldSessions: async () => {
    const response = await axios.delete(`${API_URL}/sessions/?olderThanWeek=true`);
    return response.data;
  }
};