const AttendanceUnlockRequestService = require('../services/AttendanceUnlockRequestService');
const { checkDataAvailableInRedis, storeAttendanceInRedis } = require("../utils/getRedisAttendenceData");
const { getAttendanceSelectedGroupDateMysql } = require("../services/attendenceService");
const { setStatusFromDateGroup } = require("../services/groupAttendenceLockServices");

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
      const { requestedById, requestedBy, requestReason, requestedDate } = req.body;
      // console.log(req.body);

      // Validate required fields
      if (!requestedById || !requestedBy || !requestedDate) {
        return res.status(400).json({
          success: false,
          message: 'Required fields missing: requestedById, requestedBy, and requestedDate are mandatory'
        });
      }

      // Call service to create the request
      const request = await this.requestService.createRequest(
        requestedById,
        requestedBy,
        requestReason,
        requestedDate
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
    // console.log(req.body);

    try {
      const { requestId } = req.params;
      const { statusBy, status, user, date } = req.body;

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
        // Extract group list from user's reporting groups
        const groupList = user.userReportingGroup || [];
        // console.log("this is called");

        // Get the requested date
        let formattedDateString;

        // Use the date from the request body
        if (date) {
          // Check if it's in MM/DD/YYYY format
          if (typeof date === 'string' && date.includes('/')) {
            const dateParts = date.split('/');
            // Create date as YYYY-MM-DD
            formattedDateString = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
          } else {
            // Already in YYYY-MM-DD format or not a string
            formattedDateString = date;
          }

          // console.log(formattedDateString);

          // Process the data unlocking first
          try {
            // Check data availability in Redis
            const availableStatus = await checkDataAvailableInRedis(formattedDateString, groupList);

            // Identify groups that are not available in Redis
            const unavailableGroups = groupList.filter(
              groupName => !availableStatus.groups[groupName]?.available
            );

            // Fetch attendance data for unavailable groups
            const mysqlAttendanceData = await getAttendanceSelectedGroupDateMysql(
              unavailableGroups,
              formattedDateString
            );

            // Store attendance data in Redis
            const redisKeys = storeAttendanceInRedis(mysqlAttendanceData);

            // Change status to unlocked in database
            const result = await setStatusFromDateGroup(groupList, formattedDateString, "unlocked", user);

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
          // If no date is available, return an error
          return res.status(400).json({
            success: false,
            message: 'Requested date is missing'
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
}

module.exports = new AttendanceUnlockRequestController();