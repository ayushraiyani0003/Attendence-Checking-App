import { useState, useEffect } from 'react';
import { usePopupNotificationClient } from '../../hooks/useNotification';
import './PopupNotification.css';

/**
 * Modern Popup Notification Component
 * 
 * A sleek, modern popup with a clean design that works well on both light and dark backgrounds.
 * Features a simplified layout focusing on clear information presentation.
 */
const PopupNotification = () => {
  // Use the notification hook
  const {
    visible,
    currentPopup,
    handleDismiss
  } = usePopupNotificationClient();
  
  // If not visible or no current popup, don't render anything
  if (!visible || !currentPopup) {
    return null;
  }
  
  // Get the formatted times
  const { formattedTimes } = currentPopup;
  
  // Determine if this is a maintenance message
  const isMaintenance = currentPopup.title?.toLowerCase().includes('maintenance') || 
                        currentPopup.message?.toLowerCase().includes('maintenance');
  
  const popupThemeClass = isMaintenance ? 'maintenance' : 'info';
  
  // Format time duration if both start and end times exist
  const getDuration = () => {
    if (formattedTimes?.startDate && formattedTimes?.endDate) {
      const start = new Date(`${formattedTimes.startDate} ${formattedTimes.startTime}`);
      const end = new Date(`${formattedTimes.endDate} ${formattedTimes.endTime}`);
      
      // Calculate difference in hours
      const diffHours = Math.round((end - start) / (1000 * 60 * 60));
      
      if (diffHours <= 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
      } else {
        const days = Math.floor(diffHours / 24);
        const hours = diffHours % 24;
        return `${days} day${days !== 1 ? 's' : ''} ${hours > 0 ? `and ${hours} hour${hours !== 1 ? 's' : ''}` : ''}`;
      }
    }
    return null;
  };
  
  const duration = getDuration();
  
  return (
    <div className="popup-overlay">
      <div className={`popup-container ${popupThemeClass}`}>
        {/* Header with icon */}
        <div className="popup-header">
          <div className="popup-icon">
            {isMaintenance ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="icon-svg">
                <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="icon-svg">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          
          <div className="popup-header-content">
            <h3 className="popup-title">{currentPopup.title}</h3>
            <p className="popup-subtitle">
              {isMaintenance ? 'System Maintenance Notice' : 'Important Information'}
            </p>
            
            {isMaintenance && (
              <div className="status-indicator">
                <span className="status-dot"></span>
                <span>Scheduled Event</span>
              </div>
            )}
          </div>
          
          <button
            onClick={handleDismiss}
            className="popup-close-button"
            aria-label="Close notification"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="close-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Message body */}
        <div className="popup-body">
          <p className="popup-message">{currentPopup.message}</p>
          
          {/* Time information */}
          {formattedTimes && (formattedTimes.startTime || formattedTimes.endTime) && (
            <div className="popup-time-container">
              {formattedTimes.startTime && (
                <div className="popup-time-card">
                  <div className="time-card-header">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="time-icon">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm-.75-6.01V7a.75.75 0 011.5 0v3.01h2.75a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                    </svg>
                    <span className="time-label">Starts</span>
                  </div>
                  <div className="time-value">{formattedTimes.startTime} on {formattedTimes.startDate}</div>
                </div>
              )}
              
              {formattedTimes.endTime && (
                <div className="popup-time-card">
                  <div className="time-card-header">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="time-icon">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-6.536a.75.75 0 10-1.061-1.061l-1.591 1.59V7.75a.75.75 0 00-1.5 0v4.243l-1.591-1.59a.75.75 0 10-1.061 1.06l2.828 2.829a.75.75 0 001.06 0l2.828-2.829z" clipRule="evenodd" />
                    </svg>
                    <span className="time-label">Ends</span>
                  </div>
                  <div className="time-value">{formattedTimes.endTime} on {formattedTimes.endDate}</div>
                </div>
              )}
              
              {duration && (
                <div className="popup-time-card">
                  <div className="time-card-header">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="time-icon">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5.25L7.612 12.4a.75.75 0 00.776 1.285l1.912-1.152a.752.752 0 00.45-.684V5z" clipRule="evenodd" />
                    </svg>
                    <span className="time-label">Duration</span>
                  </div>
                  <div className="time-value">{duration}</div>
                </div>
              )}
            </div>
          )}
          
          {/* Contact Information */}
          <div className="contact-section">
            <div className="contact-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="contact-icon">
                <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
              </svg>
              <h4 className="contact-title">Need assistance?</h4>
            </div>
            
            <p className="contact-info">
              {isMaintenance
                ? <>For urgent support during this period, please contact IT Support at <span className="contact-highlight">HR Office.</span></>
                : <>Contact our support team at <span className="contact-highlight">HR Office</span></>
              }
            </p>
          </div>
        </div>
        
        {/* Footer with action button */}
        <div className="popup-footer">
          <button
            onClick={handleDismiss}
            className="popup-action-button"
          >
            {isMaintenance ? 'Acknowledge' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupNotification;