import React, { useState, useEffect } from 'react';
import { useAttendanceUnlock } from '../../context/AttendanceUnlockContext';
import './AttendanceUnlockPage.css';

const AttendanceUnlockPage = ({ monthYearString, user }) => {
  // Parse roles and permissions
  const isAdmin = user?.role === 'admin';
  const userId = user?.id;
  const userName = user?.name || 'Unknown User';

  // State for the date range picker and reason
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState('');

  // Function to parse URL query parameters
const getQueryParams = () => {
  const searchParams = new URLSearchParams(window.location.search);
  // Get single date parameter
  const date = searchParams.get('date');
  return {
    date
  };
};

// Format the date string to YYYY-MM-DD format for the date input
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  
  // Check if date is in DD/MM/YYYY format
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = dateString.match(dateRegex);
  
  if (match) {
    // Convert DD/MM/YYYY to YYYY-MM-DD
    const [_, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  try {
    // Try to parse the date if it's in another format
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Error parsing date:', error);
  }
  
  return '';
};

// Set the start and end dates from URL parameter when component mounts
useEffect(() => {
  const { date } = getQueryParams();
  if (date) {
    const formattedDate = formatDateForInput(date);
    if (formattedDate) {
      // Set both start and end date to the same value initially
      setStartDate(formattedDate);
      setEndDate(formattedDate);
    }
  }
}, []);

  // Parse the month and year from string
  const parseMonthYear = (monthYearString) => {
    if (!monthYearString) return { month: null, year: null };
    
    const [monthStr, yearStr] = monthYearString.split(' ');
    const monthMap = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
      'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    return {
      month: monthMap[monthStr],
      year: parseInt(yearStr)
    };
  };

  // Get the context for attendance unlock requests
  const {
    requests,
    loading,
    error,
    updateFilters,
    fetchRequests,
    submitRequest,
    handleRequestStatus
  } = useAttendanceUnlock();

  // Update filters when monthYearString changes
  useEffect(() => {
    if (monthYearString) {
      const { month, year } = parseMonthYear(monthYearString);
      updateFilters({ month, year });
    }
  }, [monthYearString, updateFilters]);

  // Separate requests by status
  const pendingRequests = requests.filter(req => req.status === 'pending');
  const approvedRequests = requests.filter(req => req.status === 'approved');
  const rejectedRequests = requests.filter(req => req.status === 'rejected');

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Validate date range
  const validateDateRange = () => {
    if (!startDate || !endDate) {
      return false;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return start <= end;
  };

  // Handle submit request
  const handleSubmitRequest = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      alert('Please select start and end dates and provide a reason');
      return;
    }

    if (!validateDateRange()) {
      alert('End date must be after or equal to start date');
      return;
    }

    try {
      await submitRequest({
        requestedById: userId,
        requestedBy: userName,
        requestedDateRange: {
          startDate,
          endDate
        },
        requestReason: reason,
      });

      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');

      // Show success message
      // alert('Request submitted successfully');
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request');
    }
  };

  // Open approval/rejection dialog
  const openActionDialog = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setOpenDialog(true);
  };

  // Handle approve/reject action
  const handleAction = async () => {
    if (!selectedRequest) return;

    try {
      await handleRequestStatus(
        selectedRequest.id,
        actionType,
        userName,
        user,
        selectedRequest.dateRange // Using dateRange instead of single date
      );

      setOpenDialog(false);
      setSelectedRequest(null);

      // Show success message
      // alert(`Request ${actionType} successfully`);
    } catch (error) {
      console.error(`Error ${actionType} request:`, error);
      alert(`Failed to ${actionType} request`);
    }
  };

  // Get today's date in YYYY-MM-DD format for max date attribute
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date to display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format date range for display
  const formatDateRange = (dateRange) => {
    if (!dateRange || (!dateRange.startDate && !dateRange.endDate)) {
      return '';
    }
    
    const startFormatted = formatDate(dateRange.startDate);
    const endFormatted = formatDate(dateRange.endDate);
    
    if (startFormatted === endFormatted) {
      return startFormatted; // Single day
    }
    
    return `${startFormatted} - ${endFormatted}`;
  };

  // Loading state
  if (loading) {
    return <div className="attendance-unlock-loading">Loading...</div>;
  }

  // Error state
  if (error) {
    return <div className="attendance-unlock-error">Error: {error}</div>;
  }

  // Get badge style class for status
  const getBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'badge pending';
      case 'approved': return 'badge approved';
      case 'rejected': return 'badge rejected';
      default: return 'badge';
    }
  };

  const renderPendingRequests = () => {
    if (pendingRequests.length === 0) {
      return <div className="no-requests">No pending requests</div>;
    }
    
    return pendingRequests.map((request) => (
      <div key={request.id} className="request-item pending">
        <h3>
          Attendance Unlock Request
          <span className="badge pending">PENDING</span>
        </h3>
        <div className="request-details">
          <div className="detail">
            <span className="detail-label">Date Range:</span>
            <span className="detail-value">{formatDateRange(request.dateRange)}</span>
          </div>
          <div className="detail">
            <span className="detail-label">Requested At:</span>
            <span className="detail-value">{request.requestedAt}</span>
          </div>
          <div className="detail">
            <span className="detail-label">By:</span>
            <span className="detail-value">{request.employeeName}</span>
          </div>
        </div>
        <div className="request-reason">
          "{request.reason}"
        </div>
        {isAdmin && (
          <div className="action-btns">
            <button
              className="approve-btn"
              onClick={() => openActionDialog(request, 'approved')}
            >
              Approve
            </button>
            <button
              className="reject-btn"
              onClick={() => openActionDialog(request, 'rejected')}
            >
              Reject
            </button>
          </div>
        )}
      </div>
    ));
  };

  const renderApprovedRequests = () => {
    if (approvedRequests.length === 0) {
      return <div className="no-requests">No approved requests</div>;
    }
    
    return approvedRequests.map((request) => (
      <div key={request.id} className="request-item approved">
        <h3>
          Attendance Unlock Request
          <span className="badge approved">APPROVED</span>
        </h3>
        <div className="request-details">
          <div className="detail">
            <span className="detail-label">Date Range:</span>
            <span className="detail-value">{formatDateRange(request.dateRange)}</span>
          </div>
          <div className="detail">
            <span className="detail-label">Requested At:</span>
            <span className="detail-value">{request.requestedAt}</span>
          </div>
          <div className="detail">
            <span className="detail-label">By:</span>
            <span className="detail-value">{request.employeeName}</span>
          </div>
          <div className="detail">
            <span className="detail-label">Approved By:</span>
            <span className="detail-value">{request.approvedBy}</span>
          </div>
        </div>
        <div className="request-reason">
          "{request.reason}"
        </div>
      </div>
    ));
  };

  const renderRejectedRequests = () => {
    if (rejectedRequests.length === 0) {
      return <div className="no-requests">No rejected requests</div>;
    }
    
    return rejectedRequests.map((request) => (
      <div key={request.id} className="request-item rejected">
        <h3>
          Attendance Unlock Request
          <span className="badge rejected">REJECTED</span>
        </h3>
        <div className="request-details">
          <div className="detail">
            <span className="detail-label">Date Range:</span>
            <span className="detail-value">{formatDateRange(request.dateRange)}</span>
          </div>
          <div className="detail">
            <span className="detail-label">Requested At:</span>
            <span className="detail-value">{request.requestedAt}</span>
          </div>
          <div className="detail">
            <span className="detail-label">By:</span>
            <span className="detail-value">{request.employeeName}</span>
          </div>
          <div className="detail">
            <span className="detail-label">Rejected By:</span>
            <span className="detail-value">{request.approvedBy}</span>
          </div>
        </div>
        <div className="request-reason">
          "{request.reason}"
        </div>
      </div>
    ));
  };

  return (
    <div className="attendance-page-container">
      <header className="page-header">
        <h1>Attendance Unlock Request System</h1>
        <p>Submit a request to unlock attendance for a date range</p>
      </header>

      {/* Request form card with date range picker */}
      <div className="card request-form-card">
        <div className="date-picker-section">
          <h2>Select Date Range to Unlock Attendance</h2>
          <div className="date-range-picker-wrapper">
            <div className="date-input-container">
              <label htmlFor="start-date">Start Date:</label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || getTodayString()}
                required
              />
            </div>
            <div className="date-input-container">
              <label htmlFor="end-date">End Date:</label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={getTodayString()}
                required
              />
            </div>
            <button
              className="submit-btn"
              onClick={handleSubmitRequest}
              disabled={!startDate || !endDate || !reason.trim() || !validateDateRange()}
            >
              Submit Request
            </button>
          </div>
          <textarea
            className="reason-textarea"
            placeholder="Reason for attendance unlock request..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          ></textarea>
          <p style={{ color: 'red', margin: '2px 0' }}>
            Attendance Unlock Request approved within 5-15 min. Please wait for 15 minutes then reload the site.
          </p>
        </div>
      </div>

      {/* Tabs section */}
      <div className="tabs-section">
        <div className="tabs">
          <div
            className={`tab ${tabValue === 0 ? 'active' : ''}`}
            onClick={() => setTabValue(0)}
          >
            Pending Requests <span className="badge pending">{pendingRequests.length}</span>
          </div>
          <div
            className={`tab ${tabValue === 1 ? 'active' : ''}`}
            onClick={() => setTabValue(1)}
          >
            Approved Requests <span className="badge approved">{approvedRequests.length}</span>
          </div>
          <div
            className={`tab ${tabValue === 2 ? 'active' : ''}`}
            onClick={() => setTabValue(2)}
          >
            Rejected Requests <span className="badge rejected">{rejectedRequests.length}</span>
          </div>
        </div>

        {/* Tab content areas */}
        <div className={`tab-content ${tabValue === 0 ? 'active' : ''}`}>
          <div className="request-list">
            {renderPendingRequests()}
          </div>
        </div>

        <div className={`tab-content ${tabValue === 1 ? 'active' : ''}`}>
          <div className="request-list">
            {renderApprovedRequests()}
          </div>
        </div>

        <div className={`tab-content ${tabValue === 2 ? 'active' : ''}`}>
          <div className="request-list">
            {renderRejectedRequests()}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {openDialog && (
        <div className="confirmation-dialog">
          <div className="dialog-content">
            <h3 id="alert-dialog-title">
              {actionType === 'approved' ? 'Approve Request' : 'Reject Request'}
            </h3>
            <div id="alert-dialog-description">
              Are you sure you want to {actionType === 'approved' ? 'approve' : 'reject'} this request?
            </div>
            <div className="dialog-actions">
              <button onClick={() => setOpenDialog(false)} className="dialog-cancel-btn">
                Cancel
              </button>
              <button onClick={handleAction} className="dialog-confirm-btn" autoFocus>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceUnlockPage;