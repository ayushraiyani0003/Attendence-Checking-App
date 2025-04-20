// AttendanceChangeLogService.js
const db = require('../models'); // Adjust path to your models directory
const { Op } = require('sequelize');
const redisClient = require('../config/redisConfig'); // Adjust path to your Redis client

class AttendanceChangeLogService {
  constructor() {
    this.AttendanceChangeLog = db.AttendanceChangeLog;
    this.Employee = db.Employee;
    this.User = db.User;
    this.logsKey = 'logs:all';
    this.client = redisClient;
  }

  /**
   * Create a new attendance change log in MySQL from data
   * @param {Object} logData - The log data to store
   * @returns {Promise<Object>} - The created log record
   */
  async createLog(logData) {
    try {
      // Ensure date is properly formatted
      if (logData.attendance_date && typeof logData.attendance_date === 'string') {
        // If it's in format YYYY-M-D, convert to YYYY-MM-DD
        const dateParts = logData.attendance_date.split('-');
        if (dateParts.length === 3) {
          const [year, month, day] = dateParts;
          logData.attendance_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      return await this.AttendanceChangeLog.create(logData);
    } catch (error) {
      throw new Error(`Error creating attendance change log: ${error.message}`);
    }
  }

  /**
   * Create a new attendance change log from Redis data
   * @param {Object} changeData - Redis log entry
   * @returns {Promise<Object>} - The created log record
   */
  async createLogFromRedis(changeData) {
    try {
      const {
        log_id,
        employee_id,
        attendance_date, 
        update_datetime,
        field,
        new_value,
        old_value,
        changed_by_id,
        changed_by,
        employee_punch_code
      } = changeData;
  
      // Ensure log_id is not too long (max 20 chars for our DB schema)
      const truncatedLogId = log_id.substring(0, 19);
  
      // Format date properly (ensure it's YYYY-MM-DD)
      let formattedDate = attendance_date;
      if (typeof attendance_date === 'string') {
        const dateParts = attendance_date.split('-');
        if (dateParts.length === 3) {
          const [year, month, day] = dateParts;
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
  
      // Get employee name, department, and reporting group from Employee model
      let employeeName = null;
      let employeeDepartment = null;
      let employeeReportingGroup = null;
      try {
        const employee = await this.Employee.findByPk(employee_id);
        if (employee) {
          employeeName = employee.name || null;
          employeeDepartment = employee.department || null;
          employeeReportingGroup = employee.reporting_group || null;
        }
      } catch (err) {
        console.warn(`Couldn't fetch employee data: ${err.message}`);
      }
  
      // Create the log in database
      return await this.AttendanceChangeLog.create({
        log_id: truncatedLogId,
        employee_id,
        attendance_date: formattedDate,
        update_datetime,
        field,
        new_value: new_value || '',
        old_value: old_value || '',
        changed_by_id,
        changed_by,
        employee_punch_code: employee_punch_code || '',
        employee_name: employeeName || '',
        employee_department: employeeDepartment || '',
        employee_reporting_group: employeeReportingGroup || ''
      });
    } catch (error) {
      throw new Error(`Error creating attendance change log: ${error.message}`);
    }
  }

  /**
   * Sync all logs from Redis to MySQL
   * @returns {Promise<number>} - Number of logs synced
   */
  async syncLogsFromRedis() {
    try {
      // Get all logs from Redis
      const logsJson = await this.client.get(this.logsKey);
      if (!logsJson) {
        return 0; // No logs to sync
      }

      const logs = JSON.parse(logsJson);
      if (!logs.length) {
        return 0;
      }

      // Process logs in batches to prevent memory issues
      const batchSize = 50;
      let syncedCount = 0;
      
      for (let i = 0; i < logs.length; i += batchSize) {
        const batch = logs.slice(i, i + batchSize);
        
        // Get existing log IDs to avoid duplicates
        const logIds = batch.map(log => log.log_id.substring(0, 19));
        const existingLogIds = await this.AttendanceChangeLog.findAll({
          attributes: ['log_id'],
          where: {
            log_id: {
              [Op.in]: logIds
            }
          }
        }).then(records => records.map(record => record.log_id));

        // Filter out logs that already exist in the database
        const newLogs = batch.filter(log => !existingLogIds.includes(log.log_id.substring(0, 19)));
        
        // Insert new logs
        for (const log of newLogs) {
          try {
            await this.createLogFromRedis(log);
            syncedCount++;
          } catch (err) {
            console.error(`Failed to sync log ${log.log_id}: ${err.message}`);
          }
        }
      }

      return syncedCount;
    } catch (error) {
      throw new Error(`Error syncing logs from Redis: ${error.message}`);
    }
  }

  /**
   * Get all attendance change logs
   * @param {Object} options - Query options (limit, offset, where conditions)
   * @returns {Promise<Object>} - Logs and count
   */
  async getAllLogs(options = {}) {
    try {
      const { limit = 100, offset = 0, ...filters } = options;
      
      const { count, rows } = await this.AttendanceChangeLog.findAndCountAll({
        where: filters,
        limit,
        offset,
        order: [['update_datetime', 'DESC']]
      });
      
      return { total: count, logs: rows };
    } catch (error) {
      throw new Error(`Error fetching attendance change logs: ${error.message}`);
    }
  }

  /**
   * Get logs for a specific employee
   * @param {number} employeeId - Employee ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Logs and count
   */
  async getLogsByEmployee(employeeId, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;
      
      const { count, rows } = await this.AttendanceChangeLog.findAndCountAll({
        where: { employee_id: employeeId },
        limit,
        offset,
        order: [['update_datetime', 'DESC']]
      });
      
      return { total: count, logs: rows };
    } catch (error) {
      throw new Error(`Error fetching logs for employee ${employeeId}: ${error.message}`);
    }
  }

  /**
   * Get logs for a specific date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Logs and count
   */
  async getLogsByDateRange(startDate, endDate) {
    try {
      
      const rows = await this.AttendanceChangeLog.findAndCountAll({
        where: {
          attendance_date: {
            [Op.between]: [startDate, endDate]
          }
        },
        order: [['attendance_date', 'DESC'], ['update_datetime', 'DESC']]
      });
      
      return rows
    } catch (error) {
      throw new Error(`Error fetching logs for date range: ${error.message}`);
    }
  }

  /**
   * Get logs by user who made the changes
   * @param {number} userId - User ID who made the changes
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Logs and count
   */
  async getLogsByUser(userId, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;
      
      const { count, rows } = await this.AttendanceChangeLog.findAndCountAll({
        where: { changed_by_id: userId },
        limit,
        offset,
        order: [['update_datetime', 'DESC']]
      });
      
      return { total: count, logs: rows };
    } catch (error) {
      throw new Error(`Error fetching logs for user ${userId}: ${error.message}`);
    }
  }

  /**
   * Get logs by field that was changed
   * @param {string} field - The field name that was changed
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Logs and count
   */
  async getLogsByField(field, options = {}) {
    try {
      const { limit = 100, offset = 0 } = options;
      
      const { count, rows } = await this.AttendanceChangeLog.findAndCountAll({
        where: { field },
        limit,
        offset,
        order: [['update_datetime', 'DESC']]
      });
      
      return { total: count, logs: rows };
    } catch (error) {
      throw new Error(`Error fetching logs for field ${field}: ${error.message}`);
    }
  }

  /**
   * Get specific log by ID
   * @param {string} logId - Log ID
   * @returns {Promise<Object>} - The log record
   */
  async getLogById(logId) {
    try {
      const log = await this.AttendanceChangeLog.findByPk(logId);
      if (!log) {
        throw new Error(`Log with ID ${logId} not found`);
      }
      return log;
    } catch (error) {
      throw new Error(`Error fetching log ${logId}: ${error.message}`);
    }
  }

  /**
   * Delete a log by ID
   * @param {string} logId - Log ID
   * @returns {Promise<boolean>} - Success or failure
   */
  async deleteLog(logId) {
    try {
      const result = await this.AttendanceChangeLog.destroy({
        where: { log_id: logId }
      });
      return result > 0;
    } catch (error) {
      throw new Error(`Error deleting log ${logId}: ${error.message}`);
    }
  }

  /**
   * Delete logs older than a certain date
   * @param {string} date - Date threshold (YYYY-MM-DD)
   * @returns {Promise<number>} - Number of logs deleted
   */
  async deleteOldLogs(date) {
    try {
      const result = await this.AttendanceChangeLog.destroy({
        where: {
          attendance_date: {
            [Op.lt]: date
          }
        }
      });
      return result;
    } catch (error) {
      throw new Error(`Error deleting old logs: ${error.message}`);
    }
  }
}

module.exports = AttendanceChangeLogService;