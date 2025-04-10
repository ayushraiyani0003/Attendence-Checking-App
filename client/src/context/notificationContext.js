import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import notificationService from '../services/notificationService';

// Create the context
const NotificationContext = createContext();

// Default polling interval (1 minute)
const DEFAULT_POLLING_INTERVAL = 60000;

export const NotificationProvider = ({ children, pollingInterval = DEFAULT_POLLING_INTERVAL }) => {
  // State for notifications
  const [headerMessages, setHeaderMessages] = useState([]);
  const [popupMessages, setPopupMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for dismissed popups (stored in memory)
  const [dismissedPopups, setDismissedPopups] = useState([]);

  // Fetch notifications from the API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all notifications - not just active ones for admin panel
      const [headerData, popupData] = await Promise.all([
        notificationService.getAllHeaderMessages(),
        notificationService.getAllPopupMessages()
      ]);
      
      setHeaderMessages(headerData || []);
      setPopupMessages(popupData || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch only active notifications (for client display)
  const fetchActiveNotifications = useCallback(async () => {
    try {
      setError(null);
      const data = await notificationService.getActiveNotifications();
      setHeaderMessages(data.headerMessages || []);
      setPopupMessages(data.popupMessages || []);
    } catch (err) {
      console.error('Error fetching active notifications:', err);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling setup
  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    
    // Set up polling
    const intervalId = setInterval(fetchActiveNotifications, pollingInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [fetchNotifications, fetchActiveNotifications, pollingInterval]);

  // Force refresh notifications
  const refreshNotifications = useCallback(() => {
    return fetchNotifications();
  }, [fetchNotifications]);

  // Dismiss a popup (client-side only, doesn't affect server state)
  const dismissPopup = useCallback((popupId) => {
    setDismissedPopups(prev => [...prev, popupId]);
  }, []);

  // Reset dismissed popups
  const resetDismissedPopups = useCallback(() => {
    setDismissedPopups([]);
  }, []);

  // Get current visible popups (filtering out dismissed ones)
  const visiblePopups = popupMessages.filter(popup => !dismissedPopups.includes(popup.id));

  // Admin functions
  // These are wrapped versions of service functions with state updates
  
  // Header message admin functions
  const createHeaderMessage = async (message) => {
    try {
      const newMessage = await notificationService.createHeaderMessage(message);
      await refreshNotifications();
      return newMessage;
    } catch (error) {
      console.error('Error creating header message:', error);
      throw error;
    }
  };

  const toggleHeaderMessageStatus = async (id) => {
    try {
      const result = await notificationService.toggleHeaderMessageStatus(id);
      await refreshNotifications();
      return result;
    } catch (error) {
      console.error('Error toggling header message status:', error);
      throw error;
    }
  };

  const deleteHeaderMessage = async (id) => {
    try {
      const result = await notificationService.deleteHeaderMessage(id);
      await refreshNotifications();
      return result;
    } catch (error) {
      console.error('Error deleting header message:', error);
      throw error;
    }
  };

  // Popup message admin functions
  const createPopupMessage = async (popupData) => {
    try {
      const newPopup = await notificationService.createPopupMessage(popupData);
      await refreshNotifications();
      return newPopup;
    } catch (error) {
      console.error('Error creating popup message:', error);
      throw error;
    }
  };

  const togglePopupMessageStatus = async (id) => {
    try {
      const result = await notificationService.togglePopupMessageStatus(id);
      await refreshNotifications();
      return result;
    } catch (error) {
      console.error('Error toggling popup status:', error);
      throw error;
    }
  };

  const deletePopupMessage = async (id) => {
    try {
      const result = await notificationService.deletePopupMessage(id);
      await refreshNotifications();
      return result;
    } catch (error) {
      console.error('Error deleting popup message:', error);
      throw error;
    }
  };

  // Value object to be provided through context
  const contextValue = {
    // Notification data
    headerMessages,
    popupMessages,
    visiblePopups,
    loading,
    error,
    
    // Client functions
    refreshNotifications,
    dismissPopup,
    resetDismissedPopups,
    
    // Admin functions for header messages
    createHeaderMessage,
    toggleHeaderMessageStatus,
    deleteHeaderMessage,
    
    // Admin functions for popup messages
    createPopupMessage,
    togglePopupMessageStatus,
    deletePopupMessage
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook for using the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};

export default NotificationContext;