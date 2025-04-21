import React, { useState, useEffect } from 'react';
import {
  Button,
  Tabs,
  Tab,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { useAttendanceUnlock } from '../../context/AttendanceUnlockContext';
import './AttendanceUnlockPage.css';

const AttendanceUnlockPage = ({ monthYearString, user }) => {
  console.log("Full user object:", user); // Add this to see the entire structure

  // Parse roles and permissions
  const isAdmin = user?.role === 'admin';
  const userId = user?.id;
  const userName = user?.name || 'Unknown User';
  console.log(user);


  console.log("isAdmin:", isAdmin);
  console.log("userId:", userId);
  console.log("userName:", userName);

  // State for the date picker and reason
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState('');

  // Parse the month and year from string
  const parseMonthYear = (monthYearString) => {
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

  // Handle submit request
  const handleSubmitRequest = async () => {
    if (!selectedDate || !reason.trim()) {
      alert('Please select a date and provide a reason');
      return;
    }

    try {
      await submitRequest({
        requestedById: userId,
        requestedBy: userName,
        requestedDate: selectedDate, // Already in YYYY-MM-DD format from HTML input
        requestReason: reason,
      });

      // Reset form
      setSelectedDate('');
      setReason('');

      // Show success message
      alert('Request submitted successfully');
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
        selectedRequest.date
      );

      setOpenDialog(false);
      setSelectedRequest(null);

      // Show success message
      alert(`Request ${actionType} successfully`);
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
      case 'pending':
        return 'badge pending';
      case 'approved':
        return 'badge approved';
      case 'rejected':
        return 'badge rejected';
      default:
        return 'badge';
    }
  };

  return (
    <div className="attendance-page-container">
      <header className="page-header">
        <h1>Attendance Unlock Request System</h1>
        <p>Submit a request to unlock attendance for any date</p>
      </header>

      <div className="card request-form-card">
        <div className="date-picker-section">
          <h2>Select Date to Unlock Attendance</h2>
          <div className="date-picker-wrapper">
            <div className="date-input-container">
              <input
                type="date"
                id="attendance-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={getTodayString()}
                required
              />
            </div>
            <button
              className="submit-btn"
              onClick={handleSubmitRequest}
              disabled={!selectedDate || !reason.trim()}
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

        <div className={`tab-content ${tabValue === 0 ? 'active' : ''}`}>
          <div className="request-list">
            {pendingRequests.length === 0 ? (
              <div className="no-requests">No pending requests</div>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className="request-item pending">
                  <h3>
                    Attendance Unlock Request
                    <span className="badge pending">PENDING</span>
                  </h3>
                  <div className="request-details">
                    <div className="detail">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{formatDate(request.date)}</span>
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
              ))
            )}
          </div>
        </div>

        <div className={`tab-content ${tabValue === 1 ? 'active' : ''}`}>
          <div className="request-list">
            {approvedRequests.length === 0 ? (
              <div className="no-requests">No approved requests</div>
            ) : (
              approvedRequests.map((request) => (
                <div key={request.id} className="request-item approved">
                  <h3>
                    Attendance Unlock Request
                    <span className="badge approved">APPROVED</span>
                  </h3>
                  <div className="request-details">
                    <div className="detail">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{formatDate(request.date)}</span>
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
              ))
            )}
          </div>
        </div>

        <div className={`tab-content ${tabValue === 2 ? 'active' : ''}`}>
          <div className="request-list">
            {rejectedRequests.length === 0 ? (
              <div className="no-requests">No rejected requests</div>
            ) : (
              rejectedRequests.map((request) => (
                <div key={request.id} className="request-item rejected">
                  <h3>
                    Attendance Unlock Request
                    <span className="badge rejected">REJECTED</span>
                  </h3>
                  <div className="request-details">
                    <div className="detail">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{formatDate(request.date)}</span>
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
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        className="confirmation-dialog"
      >
        <DialogTitle id="alert-dialog-title">
          {actionType === 'approved' ? 'Approve Request' : 'Reject Request'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to {actionType === 'approved' ? 'approve' : 'reject'} this request?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} className="dialog-cancel-btn">
            Cancel
          </Button>
          <Button onClick={handleAction} className="dialog-confirm-btn" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AttendanceUnlockPage;