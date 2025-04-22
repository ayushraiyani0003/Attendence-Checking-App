const db = require("../models");
const { Op } = require("sequelize");

// Get the model
const AttendanceUnlockRequest = db.AttendanceUnlockRequest;

/**
 * Service class for handling AttendanceUnlockRequest operations
 */
class AttendanceUnlockRequestService {
  /**
   * Create a new attendance unlock request
   * 
   * @param {number} requestedById - The ID of the employee making the request
   * @param {string} requestedBy - The name of the employee making the request
   * @param {string} requestReason - The reason for the request
   * @param {string} startDate - The start date for which attendance is to be unlocked (YYYY-MM-DD)
   * @param {string} endDate - The end date for which attendance is to be unlocked (YYYY-MM-DD)
   * @returns {Promise<Object>} - The created request
   */
  async createRequest(requestedById, requestedBy, requestReason, startDate, endDate) {
    try {
      return await AttendanceUnlockRequest.create({
        requested_by_id: requestedById,
        requested_by: requestedBy,
        request_reason: requestReason,
        requested_start_date: startDate,
        requested_end_date: endDate,
        status: 'pending'
      });
    } catch (error) {
      console.error("Error creating attendance unlock request:", error);
      throw error;
    }
  }

  /**
   * Update the status of a request (for admin approval/rejection)
   * 
   * @param {number} requestId - The ID of the request to update
   * @param {string} statusBy - Name of the admin changing the status
   * @param {string} status - New status ('approved' or 'rejected')
   * @returns {Promise<Object>} - The updated request
   */
  async updateRequestStatus(requestId, statusBy, status) {
    try {
      const request = await AttendanceUnlockRequest.findByPk(requestId);
      
      if (!request) {
        throw new Error(`Request with ID ${requestId} not found`);
      }
      
      // Update the request status
      request.status = status;
      request.status_by = statusBy;
      
      // Save the updated request
      await request.save();
      
      return request;
    } catch (error) {
      console.error(`Error updating status for request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Get attendance unlock requests based on filters
   * 
   * @param {Object} filters - Filter criteria
   * @param {number} [filters.month] - Month (1-12)
   * @param {number} [filters.year] - Year (e.g., 2025)
   * @param {number} [filters.requestedById] - ID of the employee who made the request
   * @returns {Promise<Array>} - Array of filtered attendance unlock requests
   */
  async getFilteredRequests(filters = {}) {
    try {
      const whereClause = {};
      
      // Add month and year filter if provided
      if (filters.month && filters.year) {
        const startOfMonth = new Date(filters.year, filters.month - 1, 1); // months are 0-indexed in JS Date
        const endOfMonth = new Date(filters.year, filters.month, 0); // Last day of the month
        
        // Date range should overlap with the month (either start date or end date is in the month)
        whereClause[Op.or] = [
          // Start date is in the month
          {
            requested_start_date: {
              [Op.between]: [startOfMonth, endOfMonth]
            }
          },
          // End date is in the month
          {
            requested_end_date: {
              [Op.between]: [startOfMonth, endOfMonth]
            }
          },
          // Date range encompasses the entire month (start date before month, end date after month)
          {
            [Op.and]: [
              {
                requested_start_date: {
                  [Op.lte]: startOfMonth
                }
              },
              {
                requested_end_date: {
                  [Op.gte]: endOfMonth
                }
              }
            ]
          }
        ];
      }
      
      // Add requestedById filter if provided
      if (filters.requestedById) {
        whereClause.requested_by_id = filters.requestedById;
      }
      console.log(await AttendanceUnlockRequest.findAll({
        where: whereClause,
        order: [['requested_at', 'DESC']] // Sort by requested time instead of date
      }));
      
      return await AttendanceUnlockRequest.findAll({
        where: whereClause,
        order: [['requested_at', 'DESC']] // Sort by requested time instead of date
      });
    } catch (error) {
      console.error("Error fetching filtered attendance unlock requests:", error);
      throw error;
    }
  }
}

module.exports = new AttendanceUnlockRequestService();