import React from 'react';
import { useNotificationAdmin } from '../../hooks/useNotification';
import "./NotificationManagement.css";
const AdminNotificationPanel = () => {
  const {
    // Tab state
    activeTab,
    setActiveTab,
    
    // Header message state
    headerMessage,
    setHeaderMessage,
    headerMessages,
    handleSubmitHeader,
    toggleHeaderActive,
    handleDeleteHeaderMessage,
    
    // Popup message state
    popupTitle,
    setPopupTitle,
    popupMessage,
    setPopupMessage,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    popupMessages,
    handleSubmitPopup,
    togglePopupActive,
    handleDeletePopupMessage,
    
    // Status
    loading,
    error
  } = useNotificationAdmin();

  return (
    <div className="admin-panel">
      <h1 className="panel-title">Admin Notification Management</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'header' ? 'active' : ''}`}
          onClick={() => setActiveTab('header')}
        >
          Header Messages
        </button>
        <button 
          className={`tab-button ${activeTab === 'popup' ? 'active' : ''}`}
          onClick={() => setActiveTab('popup')}
        >
          Popup Notifications
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'header' ? (
          <div className="header-messages-tab">
            <h2>Create Header Message</h2>
            <form onSubmit={handleSubmitHeader} className="message-form">
              <div className="form-group">
                <label htmlFor="headerMessage">Message Text:</label>
                <textarea
                  id="headerMessage"
                  value={headerMessage}
                  onChange={(e) => setHeaderMessage(e.target.value)}
                  placeholder="Enter the message to display in header"
                  rows="3"
                  className="text-input"
                  disabled={loading}
                />
              </div>
              <button 
                type="submit" 
                className="submit-button"
                disabled={loading || headerMessage.trim() === ''}
              >
                {loading ? 'Creating...' : 'Create Message'}
              </button>
            </form>
            
            <h2>Active Header Messages</h2>
            <div className="message-list">
              {loading && headerMessages.length === 0 ? (
                <p className="loading-message">Loading messages...</p>
              ) : headerMessages.length === 0 ? (
                <p className="no-messages">No header messages created yet.</p>
              ) : (
                headerMessages.map(msg => (
                  <div key={msg.id} className={`message-item ${msg.active ? 'active' : 'inactive'}`}>
                    <p className="message-text">{msg.message}</p>
                    <div className="message-actions">
                      <button 
                        className={`toggle-button ${msg.active ? 'active' : 'inactive'}`}
                        onClick={() => toggleHeaderActive(msg.id)}
                        disabled={loading}
                      >
                        {msg.active ? 'Active' : 'Inactive'}
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteHeaderMessage(msg.id)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="popup-messages-tab">
            <h2>Create Maintenance Popup</h2>
            <form onSubmit={handleSubmitPopup} className="message-form">
              <div className="form-group">
                <label htmlFor="popupTitle">Popup Title:</label>
                <input
                  type="text"
                  id="popupTitle"
                  value={popupTitle}
                  onChange={(e) => setPopupTitle(e.target.value)}
                  placeholder="E.g., Scheduled Maintenance"
                  className="text-input"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="popupMessage">Popup Message:</label>
                <textarea
                  id="popupMessage"
                  value={popupMessage}
                  onChange={(e) => setPopupMessage(e.target.value)}
                  placeholder="Enter details about the maintenance"
                  rows="4"
                  className="text-input"
                  disabled={loading}
                />
              </div>
              <div className="time-inputs">
                <div className="form-group">
                  <label htmlFor="startTime">Start Time:</label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="time-input"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endTime">End Time:</label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="time-input"
                    disabled={loading}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="submit-button"
                disabled={loading || popupTitle.trim() === '' || popupMessage.trim() === '' || !startTime || !endTime}
              >
                {loading ? 'Creating...' : 'Create Popup'}
              </button>
            </form>
            
            <h2>Maintenance Popups</h2>
            <div className="message-list">
              {loading && popupMessages.length === 0 ? (
                <p className="loading-message">Loading popups...</p>
              ) : popupMessages.length === 0 ? (
                <p className="no-messages">No popup messages created yet.</p>
              ) : (
                popupMessages.map(popup => (
                  <div key={popup.id} className={`popup-item ${popup.active ? 'active' : 'inactive'}`}>
                    <div className="popup-header">
                      <h3 className="popup-title">{popup.title}</h3>
                      <div className="message-actions">
                        <button 
                          className={`toggle-button ${popup.active ? 'active' : 'inactive'}`}
                          onClick={() => togglePopupActive(popup.id)}
                          disabled={loading}
                        >
                          {popup.active ? 'Active' : 'Inactive'}
                        </button>
                        <button 
                          className="delete-button"
                          onClick={() => handleDeletePopupMessage(popup.id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="popup-message">{popup.message}</p>
                    <div className="popup-times">
                      <span>From: {new Date(popup.startTime).toLocaleString()}</span>
                      <span>To: {new Date(popup.endTime).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      
    </div>
  );
};

export default AdminNotificationPanel;