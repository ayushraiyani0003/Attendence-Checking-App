import React, { useEffect, useRef } from 'react';
import './CommentPopup.css';

/**
 * CommentPopup component to display all comments for an employee
 * @param {Object} props - Component props
 * @param {Object} props.rowData - Data for the employee row
 * @param {Function} props.onClose - Function to call when closing the popup
 */
const CommentPopup = ({ rowData, onClose }) => {
  const popupRef = useRef(null);
  
  // Initialize comments array - will remain empty if no valid rowData
  const comments = rowData?.attendance?.filter(att => att.comment && att.comment.trim() !== "") || [];
  
  // Format date for better readability (optional)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Assuming date format is DD/MM/YYYY
    const [day, month, year] = dateString.split('/');
    return `${day}/${month}/${year}`;
  };

  // Check if content is scrollable to add fade effect
  useEffect(() => {
    const contentElement = document.querySelector('.comment-popup-content');
    if (contentElement) {
      if (contentElement.scrollHeight > contentElement.clientHeight) {
        contentElement.classList.add('scrollable');
      } else {
        contentElement.classList.remove('scrollable');
      }
    }
  }, [comments]);

  // Handle click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Don't render anything if no valid rowData or no comments
  if (!rowData || comments.length === 0) return null;
  
  return (
    <div className="comment-popup-container">
      <div className="comment-popup" ref={popupRef}>
        <div className="comment-popup-header">
          <strong>Comments for {rowData.punchCode}</strong>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="comment-popup-content">
          <table className="comment-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((att, index) => (
                <tr key={index}>
                  <td>{formatDate(att.date)}</td>
                  <td>{att.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommentPopup;