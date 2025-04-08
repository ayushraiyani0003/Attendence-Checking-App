// contexts/SessionContext.js
import React, { createContext, useState, useContext } from 'react';
import { sessionService } from '../services/sessionsServices';
import { toast } from 'react-toastify';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Delete all sessions
  const deleteAllSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await sessionService.deleteAllSessions();
      toast.success(response.message || 'All sessions deleted successfully');
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete sessions';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete sessions for a specific user
  const deleteUserSessions = async (userId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await sessionService.deleteUserSessions(userId);
      toast.success(response.message || `Sessions for user ${userId} deleted successfully`);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete user sessions';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete inactive sessions
  const deleteInactiveSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await sessionService.deleteInactiveSessions();
      toast.success(response.message || 'Inactive sessions deleted successfully');
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete inactive sessions';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete sessions older than a week
  const deleteOldSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await sessionService.deleteOldSessions();
      toast.success(response.message || 'Old sessions deleted successfully');
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete old sessions';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isLoading,
    error,
    deleteAllSessions,
    deleteUserSessions,
    deleteInactiveSessions,
    deleteOldSessions
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};