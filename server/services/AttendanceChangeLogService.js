const db = require("../models"); // Adjust path to your models directory
const { Op } = require("sequelize");
const redisClient = require("../config/redisConfig"); // Adjust path to your Redis client

class AttendanceChangeLogService {
    constructor() {
        this.AttendanceChangeLog = db.AttendanceChangeLog;
        this.Employee = db.Employee;
        this.User = db.User;
        this.logsKey = "logs:all";
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
            if (
                logData.attendance_date &&
                typeof logData.attendance_date === "string"
            ) {
                // If it's in format YYYY-M-D, convert to YYYY-MM-DD
                const dateParts = logData.attendance_date.split("-");
                if (dateParts.length === 3) {
                    const [year, month, day] = dateParts;
                    logData.attendance_date = `${year}-${month.padStart(
                        2,
                        "0"
                    )}-${day.padStart(2, "0")}`;
                }
            }

            return await this.AttendanceChangeLog.create(logData);
        } catch (error) {
            throw new Error(
                `Error creating attendance change log: ${error.message}`
            );
        }
    }

    /**
     * Create a new attendance change log from Redis data
     * @param {Object} changeData - Redis log entry
     * @returns {Promise<Object>} - The created log record
     */
    async createLogFromRedis(changeData) {
        try {
            // Debug the input data
            // console.log('Processing log with ID:', changeData.log_id);

            // Extract all fields with proper defaults
            const {
                log_id = "",
                employee_id = null,
                attendance_date = null,
                update_datetime = null,
                field = "",
                new_value = "",
                old_value = "",
                changed_by_id = null,
                changed_by = "",
                employee_punch_code = "",
            } = changeData;

            // Validate required fields
            if (!log_id) {
                throw new Error("Missing log_id");
            }

            if (!employee_id) {
                throw new Error("Missing employee_id");
            }

            if (!attendance_date) {
                throw new Error("Missing attendance_date");
            }

            if (!update_datetime) {
                throw new Error("Missing update_datetime");
            }

            if (!field) {
                throw new Error("Missing field");
            }

            if (!changed_by_id) {
                throw new Error("Missing changed_by_id");
            }

            if (!changed_by) {
                throw new Error("Missing changed_by");
            }

            // Convert and validate employee_id (must be integer)
            let parsedEmployeeId;
            try {
                parsedEmployeeId = parseInt(employee_id, 10);
                if (isNaN(parsedEmployeeId)) {
                    throw new Error(`Invalid employee_id: ${employee_id}`);
                }
            } catch (err) {
                throw new Error(`Invalid employee_id format: ${err.message}`);
            }

            // Convert and validate changed_by_id (must be integer)
            let parsedChangedById;
            try {
                parsedChangedById = parseInt(changed_by_id, 10);
                if (isNaN(parsedChangedById)) {
                    throw new Error(`Invalid changed_by_id: ${changed_by_id}`);
                }
            } catch (err) {
                throw new Error(`Invalid changed_by_id format: ${err.message}`);
            }

            // Format date properly (ensure it's YYYY-MM-DD)
            let formattedDate;

            if (attendance_date instanceof Date) {
                formattedDate = attendance_date.toISOString().split("T")[0];
            } else if (typeof attendance_date === "string") {
                // Try parsing as ISO date first
                const dateObj = new Date(attendance_date);
                if (!isNaN(dateObj.getTime())) {
                    formattedDate = dateObj.toISOString().split("T")[0];
                } else {
                    // Try manual parsing for format YYYY-M-D
                    const dateParts = attendance_date.split("-");
                    if (dateParts.length === 3) {
                        const [year, month, day] = dateParts;
                        if (
                            !isNaN(parseInt(year)) &&
                            !isNaN(parseInt(month)) &&
                            !isNaN(parseInt(day))
                        ) {
                            formattedDate = `${year}-${month.padStart(
                                2,
                                "0"
                            )}-${day.padStart(2, "0")}`;
                        } else {
                            throw new Error(
                                `Cannot parse date parts: ${attendance_date}`
                            );
                        }
                    } else {
                        throw new Error(
                            `Invalid date format: ${attendance_date}`
                        );
                    }
                }
            } else {
                throw new Error(
                    `Unsupported date type: ${typeof attendance_date}`
                );
            }

            // Validate formatted date
            if (!formattedDate || !/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
                throw new Error(`Invalid formatted date: ${formattedDate}`);
            }

            // Ensure update_datetime is a valid Date
            let formattedDateTime;

            if (update_datetime instanceof Date) {
                formattedDateTime = update_datetime;
            } else if (typeof update_datetime === "string") {
                const dateTimeObj = new Date(update_datetime);
                if (isNaN(dateTimeObj.getTime())) {
                    throw new Error(
                        `Invalid datetime string: ${update_datetime}`
                    );
                }
                formattedDateTime = dateTimeObj;
            } else if (typeof update_datetime === "number") {
                // Handle timestamp
                const dateTimeObj = new Date(update_datetime);
                if (isNaN(dateTimeObj.getTime())) {
                    throw new Error(`Invalid timestamp: ${update_datetime}`);
                }
                formattedDateTime = dateTimeObj;
            } else {
                throw new Error(
                    `Unsupported datetime type: ${typeof update_datetime}`
                );
            }

            // Get employee name, department, and reporting group from Employee model
            let employeeName = "";
            let employeeDepartment = "";
            let employeeReportingGroup = "";

            try {
                const employee = await this.Employee.findByPk(parsedEmployeeId);
                if (employee) {
                    employeeName = employee.name || "";
                    employeeDepartment = employee.department || "";
                    employeeReportingGroup = employee.reporting_group || "";
                } else {
                    console.warn(
                        `Employee with ID ${parsedEmployeeId} not found`
                    );
                }
            } catch (err) {
                console.warn(`Couldn't fetch employee data: ${err.message}`);
            }

            // Prepare the record with proper type handling and ensure all fields meet DB constraints
            const record = {
                log_id: String(log_id).substring(0, 254), // Ensure it fits in VARCHAR(255)
                employee_id: parsedEmployeeId,
                attendance_date: formattedDate,
                update_datetime: formattedDateTime,
                field: String(field).substring(0, 49), // Ensure it fits in VARCHAR(50)
                new_value:
                    new_value !== null && new_value !== undefined
                        ? String(new_value)
                        : "",
                old_value:
                    old_value !== null && old_value !== undefined
                        ? String(old_value)
                        : "",
                changed_by_id: parsedChangedById,
                changed_by: String(changed_by).substring(0, 99), // Ensure it fits in VARCHAR(100)
                employee_punch_code:
                    employee_punch_code !== null &&
                    employee_punch_code !== undefined
                        ? String(employee_punch_code).substring(0, 49)
                        : "",
                employee_name: String(employeeName || "").substring(0, 99), // Ensure it fits in VARCHAR(100)
                employee_department: String(employeeDepartment || ""),
                employee_reporting_group: String(employeeReportingGroup || ""),
            };

            // // console.log('Creating log with data:', JSON.stringify({
            //   log_id: record.log_id,
            //   employee_id: record.employee_id,
            //   attendance_date: record.attendance_date,
            //   field: record.field,
            //   changed_by_id: record.changed_by_id
            // }));

            // Create the log in database
            return await this.AttendanceChangeLog.create(record);
        } catch (error) {
            throw new Error(
                `Error creating attendance change log: ${error.message}`
            );
        }
    }

    /**
     * Sync all logs from Redis to MySQL
     * @returns {Promise<number>} - Number of logs synced
     */
    async syncLogsFromRedis() {
        try {
            // console.log('Starting Redis to MySQL log sync...');

            // Get all logs from Redis
            const logsJson = await this.client.get(this.logsKey);
            if (!logsJson) {
                // console.log('No logs found in Redis');
                return 0; // No logs to sync
            }

            let logs;
            try {
                logs = JSON.parse(logsJson);
                if (!Array.isArray(logs)) {
                    console.warn(
                        `Redis data is not an array, got ${typeof logs}`
                    );
                    return 0;
                }

                if (!logs.length) {
                    // console.log('Redis logs array is empty');
                    return 0;
                }

                // console.log(`Found ${logs.length} logs in Redis`);
            } catch (err) {
                console.error("Error parsing Redis logs JSON:", err.message);
                return 0;
            }

            // Debug the first log to understand structure
            if (logs.length > 0) {
                // console.log('Sample log structure:', JSON.stringify(logs[0], null, 2));
            }

            // Process logs in batches to prevent memory issues
            const batchSize = 10; // Reduced batch size for debugging
            let syncedCount = 0;
            let failedCount = 0;

            for (let i = 0; i < logs.length; i += batchSize) {
                const batch = logs.slice(i, i + batchSize);
                // console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(logs.length/batchSize)}`);

                // Ensure all logs have log_id
                const validLogs = batch.filter((log) => log && log.log_id);

                if (validLogs.length === 0) {
                    // console.log('No valid logs in this batch');
                    continue;
                }

                try {
                    // Get existing log IDs to avoid duplicates
                    const logIds = validLogs.map((log) =>
                        String(log.log_id).substring(0, 254)
                    );

                    const existingLogIds =
                        await this.AttendanceChangeLog.findAll({
                            attributes: ["log_id"],
                            where: {
                                log_id: {
                                    [Op.in]: logIds,
                                },
                            },
                        }).then((records) =>
                            records.map((record) => record.log_id)
                        );

                    // console.log(`Found ${existingLogIds.length} existing logs in database`);

                    // Filter out logs that already exist in the database
                    const newLogs = validLogs.filter(
                        (log) =>
                            !existingLogIds.includes(
                                String(log.log_id).substring(0, 254)
                            )
                    );

                    // console.log(`Found ${newLogs.length} new logs to sync`);

                    // Insert new logs
                    for (const log of newLogs) {
                        try {
                            await this.createLogFromRedis(log);
                            syncedCount++;
                            // console.log(`Successfully synced log: ${log.log_id}`);
                        } catch (err) {
                            failedCount++;
                            console.error(
                                `Failed to sync log ${log.log_id}: ${err.message}`
                            );
                            // Optionally log more details about the failed log
                            console.error(
                                "Failed log data:",
                                JSON.stringify({
                                    log_id: log.log_id,
                                    employee_id: log.employee_id,
                                    attendance_date: log.attendance_date,
                                    update_datetime: log.update_datetime,
                                    field: log.field,
                                    changed_by_id: log.changed_by_id,
                                    changed_by: log.changed_by,
                                })
                            );
                        }
                    }
                } catch (batchError) {
                    console.error(
                        `Error processing batch: ${batchError.message}`
                    );
                    // Continue with next batch instead of failing completely
                }
            }

            // console.log(`Redis to MySQL log sync completed. Synced ${syncedCount} logs, failed ${failedCount} logs.`);
            return syncedCount;
        } catch (error) {
            console.error(`Error in syncLogsFromRedis: ${error.message}`);
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

            const { count, rows } =
                await this.AttendanceChangeLog.findAndCountAll({
                    where: filters,
                    limit,
                    offset,
                    order: [["update_datetime", "DESC"]],
                });

            return { total: count, logs: rows };
        } catch (error) {
            throw new Error(
                `Error fetching attendance change logs: ${error.message}`
            );
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

            const { count, rows } =
                await this.AttendanceChangeLog.findAndCountAll({
                    where: { employee_id: employeeId },
                    limit,
                    offset,
                    order: [["update_datetime", "DESC"]],
                });

            return { total: count, logs: rows };
        } catch (error) {
            throw new Error(
                `Error fetching logs for employee ${employeeId}: ${error.message}`
            );
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
                        [Op.between]: [startDate, endDate],
                    },
                },
                order: [
                    ["attendance_date", "DESC"],
                    ["update_datetime", "DESC"],
                ],
            });

            return rows;
        } catch (error) {
            throw new Error(
                `Error fetching logs for date range: ${error.message}`
            );
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

            const { count, rows } =
                await this.AttendanceChangeLog.findAndCountAll({
                    where: { changed_by_id: userId },
                    limit,
                    offset,
                    order: [["update_datetime", "DESC"]],
                });

            return { total: count, logs: rows };
        } catch (error) {
            throw new Error(
                `Error fetching logs for user ${userId}: ${error.message}`
            );
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

            const { count, rows } =
                await this.AttendanceChangeLog.findAndCountAll({
                    where: { field },
                    limit,
                    offset,
                    order: [["update_datetime", "DESC"]],
                });

            return { total: count, logs: rows };
        } catch (error) {
            throw new Error(
                `Error fetching logs for field ${field}: ${error.message}`
            );
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
                where: { log_id: logId },
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
                        [Op.lt]: date,
                    },
                },
            });
            return result;
        } catch (error) {
            throw new Error(`Error deleting old logs: ${error.message}`);
        }
    }
}

module.exports = AttendanceChangeLogService;
