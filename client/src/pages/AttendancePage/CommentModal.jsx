import React, { useContext, useEffect, useRef } from 'react';
import { CommentPopupContext } from './DataRow';
import "./DataRow.css";

// Modal component for comments
const CommentModal = ({
  isOpen,
  onClose,
  onSubmit,
  commentText,
  setCommentText,
  attendanceData,
  rowData
}) => {
  const modalRef = useRef(null);
  const inputRef = useRef(null);

  // Format the date from DD/MM/YYYY to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const [day, month, year] = dateString.split('/');
    return `${day} ${getMonthName(month)} ${year}`;
  };

  // Get month name from month number
  const getMonthName = (monthNum) => {
    const months = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
    ];
    return months[parseInt(monthNum) - 1] || monthNum;
  };

  // Focus the textarea when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onSubmit(); // Save comment when clicking outside
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onSubmit]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onSubmit(); // Save and close
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onSubmit]);

  if (!isOpen) return null;

  return (
    <div className="comment-modal-overlay">
      <div className="comment-modal" ref={modalRef}>
        <div className="comment-modal-header">
          <h3>Add Comment</h3>
          <button className="close-button" onClick={onSubmit}>&times;</button>
        </div>
        
        <div className="comment-modal-details">
          <div className="detail-row">
            <span className="detail-label">Employee:</span>
            <span className="detail-value">{rowData?.name || "N/A"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Punch Code:</span>
            <span className="detail-value">{rowData?.punchCode || "N/A"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Date:</span>
            <span className="detail-value">{formatDate(attendanceData?.date)}</span>
          </div>
        </div>
        
        <div className="comment-modal-input">
          <label htmlFor="comment-textarea">Comment:</label>
          <textarea
            id="comment-textarea"
            ref={inputRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Enter your comment here..."
          />
        </div>
        
        <div className="comment-modal-footer">
          <button className="submit-button" onClick={onSubmit}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;