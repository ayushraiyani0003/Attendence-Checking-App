// LogRedisService.js
const redisClient = require('../config/redisConfig'); // Update this path to match your project structure

class LogRedisService {
  constructor() {
    this.client = redisClient;
    this.logsNamespace = 'logs'; // The namespace/folder for logs
  }

  /**
 * Generate a unique log ID based on date and sequence
 * @param {string} dateStr - Date string (format: DD/MM/YYYY)
 * @returns {Promise<string>} - Log ID in format YYYYMMDD+id+sequence
 */
/**
 * Generate a unique log ID based on date and timestamp
 * @param {string} dateStr - Date string (format: DD/MM/YYYY)
 * @returns {Promise<string>} - Log ID in format YYYYMMDD+timestamp
 */
async generateLogId(dateStr) {
    // Parse the date string (from DD/MM/YYYY to YYYYMMDD)
    const [day, month, year] = dateStr.split('/');
    
    // Ensure month and day are two digits
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    const formattedDate = `${year}${paddedMonth}${paddedDay}`;
    
    // Get current timestamp (milliseconds since epoch)
    const timestamp = Date.now();
    
    // Return the full log ID: YYYYMMDD + timestamp
    return `${formattedDate}id${timestamp}`;
  }

  /**
   * Format date in ISO format (YYYY-MM-DD)
   * @param {string} dateStr - Date string in DD/MM/YYYY format
   * @returns {string} - ISO date string
   */
  formatISODate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    // Ensure month and day are two digits
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
  }

  /**
   * Log an attendance change to Redis
   * @param {Object} changeData - Data about the attendance change
   * @returns {Promise<string>} - The log ID
   */
  async logAttendanceChange(changeData) {
    const {
      action,
      employeeId,
      punchCode,
      user,
      reportGroup,
      editDate,
      field,
      newValue,
      oldValue
    } = changeData;

    // Format date for log in proper ISO format (YYYY-MM-DD)
    const formattedDate = this.formatISODate(editDate);
    
    // Generate unique log ID
    const logId = await this.generateLogId(editDate);
    // console.log(logId);
    
    
    // Create log entry as a single JSON object
    const logEntry = {
      log_id: logId,
      employee_id: employeeId,
      attendance_date: formattedDate,
      update_datetime: new Date().toISOString(),
      field: field,
      new_value: newValue !== null && newValue !== undefined ? String(newValue) : "",
      old_value: oldValue !== null && oldValue !== undefined ? String(oldValue) : "",
      changed_by_id: user.id,
      changed_by: user.name,
      employee_punch_code: punchCode || "",
      report_group: reportGroup || ""
    };
    
    // The key for all logs in the logs namespace
    const logsKey = `${this.logsNamespace}:all`;
    
    // Get current logs array or create new one if it doesn't exist
    let logs = [];
    const existingLogs = await this.client.get(logsKey);
    
    if (existingLogs) {
      logs = JSON.parse(existingLogs);
    }
    
    // Add new log entry to array
    logs.push(logEntry);
    
    // Store updated array back to Redis under the logs namespace
    await this.client.set(logsKey, JSON.stringify(logs));
    
    return logId;
  }

  /**
   * Get all logs
   * @returns {Promise<Array>} - Array of all log entries
   */
  async getAllLogs() {
    const logsKey = `${this.logsNamespace}:all`;
    const logsJson = await this.client.get(logsKey);
    return logsJson ? JSON.parse(logsJson) : [];
  }

  /**
   * Get logs for a specific date
   * @param {string} date - Date string (format: YYYY-MM-DD)
   * @returns {Promise<Array>} - Array of log entries for the specified date
   */
  async getLogsByDate(date) {
    const logs = await this.getAllLogs();
    return logs.filter(log => log.attendance_date === date);
  }

  /**
   * Get logs for a specific employee
   * @param {number} employeeId - Employee ID
   * @returns {Promise<Array>} - Array of log entries for the specified employee
   */
  async getLogsByEmployee(employeeId) {
    const logs = await this.getAllLogs();
    return logs.filter(log => log.employee_id === employeeId);
  }
}

module.exports = LogRedisService;