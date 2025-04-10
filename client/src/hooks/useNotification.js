import { useState, useEffect, useCallback , useMemo} from 'react';
import { useNotifications } from '../context/notificationContext';

/**
 * ADMIN HOOKS
 */

/**
 * Custom hook for header message administration
 * @returns {Object} Header message state and functions
 */
export const useHeaderMessageAdmin = () => {
  const [headerMessage, setHeaderMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { 
    headerMessages, 
    createHeaderMessage, 
    toggleHeaderMessageStatus, 
    deleteHeaderMessage,
    refreshNotifications
  } = useNotifications();

  // Handle submission of a new header message
  const handleSubmitHeader = async (e) => {
    e.preventDefault();
    if (headerMessage.trim() === '') return;
    
    setLoading(true);
    setError(null);
    
    try {
      await createHeaderMessage(headerMessage);
      setHeaderMessage(''); // Clear the input field after successful creation
    } catch (err) {
      setError('Failed to create header message. Please try again.');
      console.error('Error creating header message:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle a header message's active status
  const toggleHeaderActive = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await toggleHeaderMessageStatus(id);
    } catch (err) {
      setError('Failed to update message status. Please try again.');
      console.error('Error toggling header message status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete a header message
  const handleDeleteHeaderMessage = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteHeaderMessage(id);
    } catch (err) {
      setError('Failed to delete message. Please try again.');
      console.error('Error deleting header message:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh header messages
  const refreshHeaderMessages = useCallback(() => {
    setLoading(true);
    refreshNotifications()
      .finally(() => setLoading(false));
  }, [refreshNotifications]);

  // Return state and functions
  return {
    headerMessage,
    setHeaderMessage,
    headerMessages,
    loading,
    error,
    handleSubmitHeader,
    toggleHeaderActive,
    handleDeleteHeaderMessage,
    refreshHeaderMessages
  };
};

/**
 * Custom hook for popup message administration
 * @returns {Object} Popup message state and functions
 */
export const usePopupMessageAdmin = () => {
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { 
    popupMessages, 
    createPopupMessage, 
    togglePopupMessageStatus, 
    deletePopupMessage,
    refreshNotifications
  } = useNotifications();

  // Set default start and end times if empty
  useEffect(() => {
    if (!startTime) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setStartTime(now.toISOString().slice(0, 16));
      
      const oneHourLater = new Date(now);
      oneHourLater.setHours(oneHourLater.getHours() + 1);
      setEndTime(oneHourLater.toISOString().slice(0, 16));
    }
  }, [startTime]);

  // Handle submission of a new popup message
  const handleSubmitPopup = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (popupTitle.trim() === '' || popupMessage.trim() === '') {
      setError('Title and message are required.');
      return;
    }
    
    if (!startTime || !endTime) {
      setError('Start and end times are required.');
      return;
    }
    
    // Validate that start time is before end time
    if (new Date(startTime) >= new Date(endTime)) {
      setError('Start time must be before end time.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await createPopupMessage({
        title: popupTitle,
        message: popupMessage,
        startTime,
        endTime
      });
      
      // Clear form fields on success
      setPopupTitle('');
      setPopupMessage('');
      
      // Don't reset times to allow for quick creation of multiple popups
      // with similar timeframes
    } catch (err) {
      setError('Failed to create popup message. Please try again.');
      console.error('Error creating popup message:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle a popup message's active status
  const togglePopupActive = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await togglePopupMessageStatus(id);
    } catch (err) {
      setError('Failed to update popup status. Please try again.');
      console.error('Error toggling popup message status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete a popup message
  const handleDeletePopupMessage = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await deletePopupMessage(id);
    } catch (err) {
      setError('Failed to delete popup. Please try again.');
      console.error('Error deleting popup message:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh popup messages
  const refreshPopupMessages = useCallback(() => {
    setLoading(true);
    refreshNotifications()
      .finally(() => setLoading(false));
  }, [refreshNotifications]);

  // Return state and functions
  return {
    popupTitle,
    setPopupTitle,
    popupMessage,
    setPopupMessage,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    popupMessages,
    loading,
    error,
    handleSubmitPopup,
    togglePopupActive,
    handleDeletePopupMessage,
    refreshPopupMessages
  };
};

/**
 * Combined hook for notification admin panel
 * @returns {Object} Combined state and functions for both header and popup messages
 */
export const useNotificationAdmin = () => {
  const [activeTab, setActiveTab] = useState('header');
  
  const headerAdmin = useHeaderMessageAdmin();
  const popupAdmin = usePopupMessageAdmin();
  
  return {
    activeTab,
    setActiveTab,
    ...headerAdmin,
    ...popupAdmin
  };
};

/**
 * CLIENT HOOKS
 */

/**
 * Custom hook for header notification display in client UI
 * @returns {Object} Header notification state and functions
 */
export const useHeaderNotificationClient = () => {
  const { headerMessages, loading } = useNotifications();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  
  // Get only active messages
  const activeMessages = headerMessages.filter(msg => msg.active);
  
  // Reset index when messages change
  useEffect(() => {
    if (currentIndex >= activeMessages.length && activeMessages.length > 0) {
      setCurrentIndex(0);
    }
  }, [activeMessages, currentIndex]);
  
  // Rotate through messages if there are multiple
  useEffect(() => {
    if (activeMessages.length <= 1) return;
    
    const intervalId = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % activeMessages.length);
    }, 5000); // Rotate every 5 seconds
    
    return () => clearInterval(intervalId);
  }, [activeMessages.length]);
  
  // Get current message
  const currentMessage = activeMessages[currentIndex];
  
  // Handle dismissing the banner temporarily
  const dismissBanner = useCallback(() => {
    setVisible(false);
    
    // Store in session storage to remember dismissal for this session
    if (currentMessage) {
      const dismissedBanners = JSON.parse(sessionStorage.getItem('dismissedBanners') || '[]');
      dismissedBanners.push(currentMessage.id);
      sessionStorage.setItem('dismissedBanners', JSON.stringify(dismissedBanners));
    }
  }, [currentMessage]);
  
  // Check if banner should be visible on initialization
  useEffect(() => {
    if (!currentMessage) return;
    
    const dismissedBanners = JSON.parse(sessionStorage.getItem('dismissedBanners') || '[]');
    setVisible(!dismissedBanners.includes(currentMessage.id));
  }, [currentMessage]);
  
  return {
    loading,
    hasMessages: activeMessages.length > 0,
    currentMessage,
    visible,
    dismissBanner,
    currentIndex,
    setCurrentIndex,
    totalMessages: activeMessages.length
  };
};

/**
 * Custom hook for popup notification display in client UI
 * @returns {Object} Popup notification state and functions
 */
/**
 * Custom hook for popup notification display in client UI
 * @returns {Object} Popup notification state and functions
 */
export const usePopupNotificationClient = () => {
  const { popupMessages, dismissPopup } = useNotifications();
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // State to track current time and force re-renders
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Get active popups - only filter by active status
  const activePopups = useMemo(() => {
    if (!popupMessages || !Array.isArray(popupMessages)) {
      return [];
    }
    
    // Simply filter by active status - no time constraints
    return popupMessages.filter(popup => popup && popup.active === true);
  }, [popupMessages]);
  
  // Store dismissed popups with timestamps
  const [dismissedPopups, setDismissedPopups] = useState(() => {
    try {
      const stored = localStorage.getItem('dismissedPopups');
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing dismissed popups from local storage:', e);
      return [];
    }
  });
  
  // Filter out dismissed popups that haven't reached their 10-minute timeout
  const visiblePopups = useMemo(() => {
    if (!activePopups.length) return [];
    
    const now = new Date();
    return activePopups.filter(popup => {
      if (!popup || !popup.id) return false;
      
      const dismissedInfo = dismissedPopups.find(dp => dp.id === popup.id);
      if (!dismissedInfo) return true; // Not dismissed, so show it
      
      try {
        // Check if 10 minutes have passed since dismissal
        const dismissalTime = new Date(dismissedInfo.timestamp);
        const tenMinutesLater = new Date(dismissalTime.getTime() + 10 * 60 * 1000);
        return now >= tenMinutesLater; // Show again if 10 minutes have passed
      } catch (error) {
        return true; // On error, show the popup
      }
    });
  }, [activePopups, dismissedPopups, currentTime]);
  
  // Format time ranges for display
  const formatPopupTimes = useMemo(() => {
    return visiblePopups.map(popup => {
      const formattedTimes = {};
      
      if (popup.startTime) {
        try {
          const startDate = new Date(popup.startTime);
          formattedTimes.startTime = startDate.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          formattedTimes.startDate = startDate.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        } catch (e) {
          formattedTimes.startTime = '';
          formattedTimes.startDate = '';
        }
      }
      
      if (popup.endTime) {
        try {
          const endDate = new Date(popup.endTime);
          formattedTimes.endTime = endDate.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          formattedTimes.endDate = endDate.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        } catch (e) {
          formattedTimes.endTime = '';
          formattedTimes.endDate = '';
        }
      }
      
      return {
        ...popup,
        formattedTimes
      };
    });
  }, [visiblePopups]);
  
  // Clean up expired dismissals
  useEffect(() => {
    const cleanupDismissals = () => {
      const now = new Date();
      const updatedDismissals = dismissedPopups.filter(dp => {
        if (!dp || !dp.timestamp) return false;
        
        try {
          const dismissalTime = new Date(dp.timestamp);
          const tenMinutesLater = new Date(dismissalTime.getTime() + 10 * 60 * 1000);
          return now < tenMinutesLater; // Keep if not expired
        } catch (error) {
          return false;
        }
      });
      
      if (updatedDismissals.length !== dismissedPopups.length) {
        setDismissedPopups(updatedDismissals);
        localStorage.setItem('dismissedPopups', JSON.stringify(updatedDismissals));
      }
    };
    
    cleanupDismissals();
    
    // Run cleanup every minute
    const intervalId = setInterval(cleanupDismissals, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [dismissedPopups]);
  
  // Force update current time periodically to check for re-showing dismissed popups
  useEffect(() => {
    const updateTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30 * 1000);
    
    return () => clearInterval(updateTimer);
  }, []);
  
  // Update visibility when visible popups change
  useEffect(() => {
    if (formatPopupTimes.length > 0) {
      setVisible(true);
      
      if (currentIndex >= formatPopupTimes.length) {
        setCurrentIndex(0);
      }
    } else {
      setVisible(false);
    }
  }, [formatPopupTimes, currentIndex]);
  
  // Handle dismissing the current popup
  const handleDismiss = useCallback(() => {
    if (!visiblePopups.length) return;
    
    const popupId = visiblePopups[currentIndex]?.id;
    if (!popupId) return;
    
    // Add to dismissed popups with current timestamp
    const newDismissedPopup = {
      id: popupId,
      timestamp: new Date().toISOString()
    };
    
    const updatedDismissedPopups = [
      ...dismissedPopups.filter(dp => dp.id !== popupId),
      newDismissedPopup
    ];
    
    setDismissedPopups(updatedDismissedPopups);
    localStorage.setItem('dismissedPopups', JSON.stringify(updatedDismissedPopups));
    
    // Use context dismissal function if available
    if (typeof dismissPopup === 'function') {
      dismissPopup(popupId);
    }
    
    // Show next popup if available
    if (visiblePopups.length > 1) {
      setCurrentIndex(prev => (prev + 1) % visiblePopups.length);
    } else {
      setVisible(false);
    }
  }, [visiblePopups, currentIndex, dismissedPopups, dismissPopup]);
  
  // Get current popup with safety check
  const currentPopup = formatPopupTimes.length > 0 && currentIndex < formatPopupTimes.length 
    ? formatPopupTimes[currentIndex] 
    : null;
  
  return {
    visible,
    currentPopup,
    handleDismiss,
    totalPopups: formatPopupTimes.length,
    currentIndex,
    setCurrentIndex
  };
};