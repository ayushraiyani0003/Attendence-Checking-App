const AttendanceUnlockRequestService = require('../services/AttendanceUnlockRequestService');
const { checkDataAvailableInRedis, storeAttendanceInRedis } = require("../utils/getRedisAttendenceData");
const { getAttendanceSelectedGroupDateMysql } = require("../services/attendenceService");
const { setStatusFromDateGroup } = require("../services/groupAttendenceLockServices");
const { getAllUsers } = require('../services/userService');

class AttendanceUnlockRequestController {
  constructor() {
    this.requestService = AttendanceUnlockRequestService;
  }

  /**
   * Create a new attendance unlock request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createRequest(req, res) {
    try {
      const { 
        requestedById, 
        requestedBy, 
        requestReason, 
        requestedDate,  // Legacy support
        requestedDateRange 
      } = req.body;
      
      // Determine the start and end dates
      let startDate, endDate;
      
      // Check if date range is provided
      if (requestedDateRange && requestedDateRange.startDate && requestedDateRange.endDate) {
        startDate = requestedDateRange.startDate;
        endDate = requestedDateRange.endDate;
      } 
      // Fall back to legacy requestedDate (use as both start and end)
      else if (requestedDate) {
        startDate = requestedDate;
        endDate = requestedDate;
      }
      
      // Validate required fields
      if (!requestedById || !requestedBy || !startDate) {
        return res.status(400).json({
          success: false,
          message: 'Required fields missing: requestedById, requestedBy, and date information are mandatory'
        });
      }

      // Call service to create the request
      const request = await this.requestService.createRequest(
        requestedById,
        requestedBy,
        requestReason,
        startDate,
        endDate
      );

      return res.status(201).json({
        success: true,
        message: 'Attendance unlock request created successfully',
        data: request
      });
    } catch (error) {
      console.error('Error in createRequest controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create attendance unlock request',
        error: error.message
      });
    }
  }

  /**
   * Update the status of an attendance unlock request (approve/reject)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateRequestStatus(req, res) {
    try {
      const { requestId } = req.params;
      const { statusBy, status, user, date, dateRange } = req.body;

      // Validate required fields
      if (!requestId || !statusBy || !status || !user) {
        return res.status(400).json({
          success: false,
          message: 'Required fields missing: requestId, statusBy, and status are mandatory'
        });
      }

      // Validate status value
      if (status !== 'approved' && status !== 'rejected') {
        return res.status(400).json({
          success: false,
          message: 'Status must be either "approved" or "rejected"'
        });
      }

      // Initialize updatedRequest before conditional block
      let updatedRequest;

      if (status === 'approved' && user) {
        // First, get the request details to get the user who made the request
        const requestDetails = await this.requestService.getRequestById(requestId);
        
        if (!requestDetails) {
          return res.status(404).json({
            success: false,
            message: 'Request not found'
          });
        }
        
        // Get the requested_by_id from the request
        const requestedById = requestDetails.requested_by_id;
        // console.log(requestedById);
        
        // Get all users to find the matching user and their reporting groups
        const allUsers = await getAllUsers();
        // console.log(allUsers);
        
        // Find the user by ID and get their reporting groups
        const requestedUser = allUsers.find(u => u.id === requestedById);
        // console.log(requestedUser.reporting_group);
        
        if (!requestedUser || !requestedUser.reporting_group) {
          return res.status(404).json({
            success: false,
            message: 'User or reporting groups not found'
          });
        }
        
        // Get the reporting groups from the user
        const groupList = requestedUser.reporting_group;
        
        if (!groupList || groupList.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No reporting groups found for this user'
          });
        }
        // console.log(groupList);
        
        // Get the dates to process
        let datesToProcess = [];
        
        // Check if dateRange is provided
        if (dateRange && dateRange.startDate && dateRange.endDate) {
          const startDate = new Date(dateRange.startDate);
          const endDate = new Date(dateRange.endDate);
          
          // Generate all dates in the range
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            datesToProcess.push(this.formatDateToYYYYMMDD(new Date(d)));
          }
        } 
        // Fall back to single date
        else if (date) {
          // Format the date
          const formattedDate = this.formatSingleDate(date);
          datesToProcess.push(formattedDate);
        } 
        else {
          // If no date information is available, return an error
          return res.status(400).json({
            success: false,
            message: 'Requested date information is missing'
          });
        }
        
        // Process each date in the range
        try {
          for (const dateToProcess of datesToProcess) {
            // Check data availability in Redis
            const availableStatus = await checkDataAvailableInRedis(dateToProcess, groupList);

            // Identify groups that are not available in Redis
            const unavailableGroups = groupList.filter(
              groupName => !availableStatus.groups[groupName]?.available
            );

            // Fetch attendance data for unavailable groups
            const mysqlAttendanceData = await getAttendanceSelectedGroupDateMysql(
              unavailableGroups,
              dateToProcess
            );

            // Store attendance data in Redis
            const redisKeys = storeAttendanceInRedis(mysqlAttendanceData);

            // Change status to unlocked in database
            const result = await setStatusFromDateGroup(groupList, dateToProcess, "unlocked", user);
          }

          // Only update the request status in the database after successful data unlocking
          updatedRequest = await this.requestService.updateRequestStatus(
            requestId,
            statusBy,
            status
          );
        } catch (unlockError) {
          console.error('Error unlocking data:', unlockError);
          return res.status(500).json({
            success: false,
            message: 'Failed to unlock attendance data',
            error: unlockError.message
          });
        }
      } else {
        // For rejected status, just update the request status
        updatedRequest = await this.requestService.updateRequestStatus(
          requestId,
          statusBy,
          status
        );
      }

      return res.status(200).json({
        success: true,
        message: `Attendance unlock request ${status} successfully`,
        data: updatedRequest
      });
    } catch (error) {
      console.error('Error in updateRequestStatus controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update attendance unlock request status',
        error: error.message
      });
    }
  }

  /**
   * Get attendance unlock requests with optional filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getFilteredRequests(req, res) {
    try {
      // Get filter parameters from query string
      const { month, year, requestedById } = req.query;

      // Parse numeric values if provided
      const filters = {};
      if (month) filters.month = parseInt(month, 10);
      if (year) filters.year = parseInt(year, 10);
      if (requestedById) filters.requestedById = parseInt(requestedById, 10);

      // Call service to get filtered requests
      const requests = await this.requestService.getFilteredRequests(filters);

      return res.status(200).json({
        success: true,
        total: requests.length,
        data: requests
      });
    } catch (error) {
      console.error('Error in getFilteredRequests controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance unlock requests',
        error: error.message
      });
    }
  }

  /**
   * Format a single date to YYYY-MM-DD
   * @param {string} date - Date string in various formats
   * @returns {string} - Formatted date string
   */
  formatSingleDate(date) {
    if (typeof date !== 'string') {
      return date;
    }

    // Check if it's in MM/DD/YYYY format
    if (date.includes('/')) {
      const dateParts = date.split('/');
      // Create date as YYYY-MM-DD
      return `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
    }
    
    // Already in YYYY-MM-DD format
    return date;
  }

  /**
   * Format JavaScript Date object to YYYY-MM-DD string
   * @param {Date} date - JavaScript Date object
   * @returns {string} - Formatted date string YYYY-MM-DD
   */
  formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

module.exports = new AttendanceUnlockRequestController();