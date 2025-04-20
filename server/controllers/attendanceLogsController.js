const AttendanceLogService = require('../services/AttendanceChangeLogService');

class AttendanceLogsController {
  constructor() {
    this.logService = new AttendanceLogService();
  }

  /**
   * Get attendance change logs for a specific date
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAttendanceLogs(req, res) {
    try {
      // Get the date parameter from the request
      const { date } = req.query; // date is in this format date: 2025-04-20
      
      // Validate date
      if (!date) {
        return res.status(400).json({ 
          success: false, 
          message: 'Date parameter is required' 
        });
      }
      
      // Call the service method to get all logs for the specific date
      const result = await this.logService.getLogsByDateRange(date, date);
      
      // Process Sequelize result to extract actual data
      // Convert Sequelize model instances to plain objects
      const logs = result.rows.map(log => log.dataValues || log);
      
      return res.status(200).json({
        success: true,
        total: result.count,
        data: logs
      });
    } catch (error) {
      console.error('Error in getAttendanceLogs controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance logs',
        error: error.message
      });
    }
  }
}

module.exports = new AttendanceLogsController();