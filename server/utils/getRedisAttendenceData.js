const redisClient = require("../config/redisConfig");

// Function to get all attendance for a given month and year
async function getRedisAttendanceData(year, month, groups) {
    const startDate = new Date(year, month - 1, 1); // First date of the month
    const endDate = new Date(year, month, 0); // Last date of the month
    const result = [];

    // Loop through all the groups
    for (const group of groups) {
        // Loop through all the days of the month
        for (let day = startDate.getDate(); day <= endDate.getDate(); day++) {
            const date = `${year}-${String(month).padStart(2, "0")}-${String(
                day
            ).padStart(2, "0")}`;
            const key = `attendance:${group}:${date}`;

            try {
                // Await the Redis GET operation
                const data = await redisClient.get(key); // Fetch the data from Redis

                if (data) {
                    result.push({ group, date, data }); // Add group, date, and data to the result if it exists
                }
            } catch (err) {
                console.error(
                    `Error fetching data for ${group} on ${date}:`,
                    err
                );
            }
        }
    }
    return result;
}
// Function to update attendance data in Redis
async function updateRedisAttendanceData(updateData) {
    try {
        // Validate input data
        if (!updateData || !updateData.employeeId || !updateData.editDate) {
            throw new Error("Missing required fields for Redis update");
        }

        // Format the date to match Redis key format (YYYY-MM-DD)
        const formattedDate = formatDate(updateData.editDate);

        // Construct the Redis key
        const key = `attendance:${updateData.reportGroup}:${formattedDate}`;

        // Retrieve existing data for the key
        const existingData = await redisClient.get(key);
        if (!existingData) {
            throw new Error(`No existing data found for key: ${key}`);
        }

        let attendanceRecords;
        try {
            // Parse existing data
            attendanceRecords = JSON.parse(existingData);
        } catch (parseError) {
            throw new Error("Error parsing existing Redis data");
        }

        // Find the specific employee record
        const employeeRecordIndex = attendanceRecords.findIndex(
            (record) => record.employee_id === updateData.employeeId
        );

        if (employeeRecordIndex === -1) {
            throw new Error(
                `No record found for employee ID ${updateData.employeeId}`
            );
        }

        // Map field names
        const fieldMapping = {
            netHR: "network_hours",
            otHR: "overtime_hours",
            shift_type: "shift_type",
            comment: "comment",
        };

        //   console.log(fieldMapping);

        // Get the mapped field name
        const mappedField = fieldMapping[updateData.field] || updateData.field;

        // Update the specific field based on its type
        if (updateData.field === "comment") {
            // For comments, store as string
            attendanceRecords[employeeRecordIndex][mappedField] =
                updateData.newValue;
        } else if (updateData.field === "shift_type") {
            // For shift_type, store as string
            attendanceRecords[employeeRecordIndex][mappedField] =
                updateData.newValue;
        } else {
            // For numeric fields, parse as float
            attendanceRecords[employeeRecordIndex][mappedField] = parseFloat(
                updateData.newValue
            );
        }

        //   console.log(`Updated ${mappedField} to:`, attendanceRecords[employeeRecordIndex][mappedField]);

        // Add metadata
        attendanceRecords[employeeRecordIndex].lastUpdatedBy =
            updateData.name || "System";
        attendanceRecords[employeeRecordIndex].lastUpdatedAt =
            new Date().toISOString();

        // Store the updated record back in Redis
        await redisClient.set(key, JSON.stringify(attendanceRecords));
        //   console.log(`Updated Redis key ${key} for employee ${updateData.employeeId}`);

        return {
            success: true,
            key: key,
            updatedRecord: attendanceRecords[employeeRecordIndex],
        };
    } catch (error) {
        console.error("Error updating Redis attendance data:", error);
        throw error;
    }
}

// delete redis data for freeup the memory base on group only "because on group data submit all data is submit"
async function deleteRedisGroupKeys(groups, year, month) {
    try {
        // Ensure groups is an array
        const groupList = Array.isArray(groups) ? groups : [groups];

        // Create date range for the specified month and year
        const startDate = new Date(year, month - 1, 1); // First date of the month
        const endDate = new Date(year, month, 0); // Last date of the month

        // Array to store deletion promises for all groups
        const deletionPromises = [];

        // Loop through all groups
        for (const group of groupList) {
            // Loop through all the days of the month
            for (
                let day = startDate.getDate();
                day <= endDate.getDate();
                day++
            ) {
                // Format the date to match Redis key format (YYYY-MM-DD)
                const date = `${year}-${String(month).padStart(
                    2,
                    "0"
                )}-${String(day).padStart(2, "0")}`;
                const key = `attendance:${group}:${date}`;

                // Add deletion promise to array
                deletionPromises.push(
                    redisClient
                        .del(key)
                        .then(() => ({ key, status: "success" }))
                        .catch((err) => ({ key, status: "failed", error: err }))
                );
            }
        }

        // Wait for all deletion operations to complete
        const deletionResults = await Promise.allSettled(deletionPromises);

        // Organize results by group
        const groupResults = {};
        groupList.forEach((group) => {
            groupResults[group] = {
                successfulDeletions: 0,
                failedDeletions: 0,
                failedKeys: [],
            };
        });

        // Process results
        deletionResults.forEach((result) => {
            if (result.status === "fulfilled") {
                const { key, status } = result.value;
                const group = key.split(":")[1];

                if (status === "success") {
                    groupResults[group].successfulDeletions++;
                } else {
                    groupResults[group].failedDeletions++;
                    groupResults[group].failedKeys.push(key);
                }
            }
        });

        return {
            success: true,
            year,
            month,
            groupResults,
        };
    } catch (error) {
        console.error("Error in deleteRedisGroupKeys:", error);
        throw error;
    }
}

// make a function for check is date awailable or not. "checkDataAvailableINRedis"
async function checkDataAvailableInRedis(date, reportingGroups) {
    // console.log("Raw input date:", date);

    try {
        // Ensure reportingGroups is an array
        const groupList = Array.isArray(reportingGroups)
            ? reportingGroups
            : [reportingGroups];

        // Format date reliably using ISO (avoids local timezone issues)
        const formattedDate = new Date(date).toISOString().split("T")[0];
        // console.log("Formatted date:", formattedDate);

        // Check Redis keys for each group
        const checkPromises = groupList.map(async (group) => {
            const key = `attendance:${group}:${formattedDate}`;
            // console.log("Checking Redis key:", key);

            try {
                const exists = await redisClient.exists(key);
                return {
                    group,
                    key,
                    exists: exists === 1,
                };
            } catch (error) {
                return {
                    group,
                    key,
                    exists: false,
                    error: error.message,
                };
            }
        });

        // Wait for all Redis checks to complete
        const checkResults = await Promise.all(checkPromises);

        // Log final check results
        // console.log("Redis check results:", checkResults);

        // Format final result
        const dataAvailability = {
            date: formattedDate,
            groups: {},
        };

        checkResults.forEach((result) => {
            dataAvailability.groups[result.group] = {
                key: result.key,
                available: result.exists,
                error: result.error || null,
            };
        });

        // Determine if all groups have data
        const allGroupsHaveData = checkResults.every((result) => result.exists);

        return {
            success: true,
            allGroupsHaveData,
            ...dataAvailability,
        };
    } catch (error) {
        console.error("Error in checkDataAvailableInRedis:", error);
        throw error;
    }
}

//make a redis key for those data just like others. makeAttendenceKeyRedis
const makeAttendenceKeyRedis = (mysqlAttendanceData) => {
    try {
        // Validate input
        // console.log(mysqlAttendanceData);

        if (
            !mysqlAttendanceData ||
            !mysqlAttendanceData.date ||
            !mysqlAttendanceData.records
        ) {
            // console.log('Invalid attendance data structure');
            return null;
        }

        // Create a mapping of reporting groups to their attendance records
        const groupedAttendance = {};

        // Group records by reporting group
        mysqlAttendanceData.records.forEach((record) => {
            const group = record.reporting_group || "default";
            if (!groupedAttendance[group]) {
                groupedAttendance[group] = [];
            }
            groupedAttendance[group].push(record);
        });

        // Generate Redis keys for each reporting group
        const redisKeys = Object.entries(groupedAttendance).map(
            ([group, records]) => {
                const redisKey = `attendance:${group}:${mysqlAttendanceData.date}`;

                // Prepare the data for Redis storage
                const redisData = records.map((record) => ({
                    employee_id: record.employee_id,
                    attendance_date: record.attendance_date,
                    shift_type: record.shift_type || "GS",
                    network_hours: record.network_hours || 0,
                    overtime_hours: record.overtime_hours || 0,
                    comment: record.comment || "",
                }));

                return {
                    key: redisKey,
                    data: redisData,
                };
            }
        );

        return redisKeys;
    } catch (error) {
        console.error("Error in makeAttendenceKeyRedis:", error);
        return null;
    }
};

// Example usage function
const storeAttendanceInRedis = async (mysqlAttendanceData) => {
    try {
        // Generate Redis keys and data
        const redisKeyData = makeAttendenceKeyRedis(mysqlAttendanceData);

        if (!redisKeyData) {
            // console.log('No Redis key data generated');
            return false;
        }

        // Store each group's attendance in Redis
        for (const entry of redisKeyData) {
            try {
                await redisClient.set(entry.key, JSON.stringify(entry.data));
                // console.log(`Stored attendance for key: ${entry.key}`);
            } catch (redisError) {
                console.error(
                    `Error storing data for key ${entry.key}:`,
                    redisError
                );
            }
        }

        return true;
    } catch (error) {
        console.error("Error storing attendance in Redis:", error);
        return false;
    }
};

// get redis data for selecetd date only with groups getSelectedDateRedisData
const getSelectedDateRedisData = async (selectedDate, groups) => {
    const result = [];

    // Ensure the selected date is in 'YYYY-MM-DD' format
    const formattedDate = formatDate(selectedDate);

    // Loop through all the groups
    for (const group of groups) {
        const key = `attendance:${group}:${formattedDate}`;

        // Log the key for debugging
        // console.log(key);

        try {
            // Await the Redis GET operation
            const data = await redisClient.get(key); // Fetch the data from Redis

            if (data) {
                result.push({ group, date: formattedDate, data }); // Add group, date, and data to the result if it exists
            }
        } catch (err) {
            console.error(
                `Error fetching data for ${group} on ${formattedDate}:`,
                err
            );
        }
    }

    return result;
};

async function deleteRedisGroupKeysForSelectedDate(selectedDate, groups) {
    try {
        selectedDate = formatDate(selectedDate);

        // Ensure groups is an array
        const groupList = Array.isArray(groups) ? groups : [groups];

        // Array to store deletion promises for all groups
        const deletionPromises = [];

        // Loop through all groups
        for (const group of groupList) {
            // Construct the Redis key for the selected date
            const key = `attendance:${group}:${selectedDate}`;

            // Add deletion promise to array
            deletionPromises.push(
                redisClient
                    .del(key)
                    .then(() => ({ key, status: "success" }))
                    .catch((err) => ({ key, status: "failed", error: err }))
            );
        }

        // Wait for all deletion operations to complete
        const deletionResults = await Promise.allSettled(deletionPromises);

        // Organize results by group
        const groupResults = {};
        groupList.forEach((group) => {
            groupResults[group] = {
                successfulDeletions: 0,
                failedDeletions: 0,
                failedKeys: [],
            };
        });

        // Process results
        deletionResults.forEach((result) => {
            if (result.status === "fulfilled") {
                const { key, status } = result.value;
                const group = key.split(":")[1];

                if (status === "success") {
                    groupResults[group].successfulDeletions++;
                } else {
                    groupResults[group].failedDeletions++;
                    groupResults[group].failedKeys.push(key);
                }
            }
        });

        return {
            success: true,
            selectedDate: selectedDate,
            groupResults,
        };
    } catch (error) {
        console.error("Error in deleteRedisGroupKeysForSelectedDate:", error);
        throw error;
    }
}

// get all attendence from redis group wise and date wise
// Function to fetch all attendance data, group-wise and date-wise, from Redis
async function getAllAttendenceDataFromRedis() {
    try {
        // Use Redis SCAN to get all keys matching the pattern 'attendance:*'
        const keys = await redisClient.keys("attendance:*");

        if (keys.length === 0) {
            // console.log('No attendance data found in Redis');
            return [];
        }

        // Initialize an array to store all attendance data
        const allAttendanceData = [];

        // Iterate over all keys and fetch the corresponding attendance data
        for (const key of keys) {
            // Retrieve the attendance data for each key
            const existingData = await redisClient.get(key);

            if (existingData) {
                // Parse the JSON data
                const attendanceRecords = JSON.parse(existingData);
                // Store the data in the result array with the key as reference
                allAttendanceData.push({
                    key,
                    attendance: attendanceRecords,
                });
            }
        }

        return allAttendanceData;
    } catch (error) {
        console.error("Error fetching attendance data from Redis:", error);
        throw error;
    }
}

// Helper function to format date to YYYY-MM-DD
// Helper function to format date to YYYY-MM-DD
function formatDate(dateString) {
    // Check if already in YYYY-MM-DD format
    const isoFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (isoFormatRegex.test(dateString)) {
        return dateString; // Return as-is if already in correct format
    }

    // Handle DD/MM/YYYY format
    const slashFormatParts = dateString.split("/");
    if (slashFormatParts.length === 3) {
        const [day, month, year] = slashFormatParts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // Handle other potential formats (add more as needed)
    const dashFormatParts = dateString.split("-");
    if (dashFormatParts.length === 3) {
        // Might be in DD-MM-YYYY format
        const [day, month, year] = dashFormatParts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    throw new Error(
        `Invalid date format: "${dateString}". Use DD/MM/YYYY or YYYY-MM-DD`
    );
}

// Get attendance data from Redis
const getAttendanceFromRedis = async (date, reportingGroup) => {
    try {
        // Ensure that `date` is formatted correctly
        const formattedDate = formatDate(date); // Make sure 'date' is a string like "YYYY-MM-DD"
        const key = `attendance:${reportingGroup}:${formattedDate}`;

        // Get data from Redis
        const attendanceData = await redisClient.get(key);

        if (!attendanceData) {
            return {
                success: false,
                message: `No attendance data found for ${reportingGroup} on ${formattedDate}`,
            };
        }

        return {
            success: true,
            data: JSON.parse(attendanceData),
        };
    } catch (error) {
        console.error("Error fetching attendance from Redis:", error);
        return {
            success: false,
            error: error.message,
        };
    }
};

// Add attendance data to Redis
const addAttendanceToRedis = async (
    employeeId,
    date,
    reportingGroup,
    attendanceData
) => {
    try {
        // Ensure date is a valid Date object
        const validDate = new Date(date);
        if (isNaN(validDate)) {
            throw new Error("Invalid date provided");
        }

        // Convert the Date object to a string (YYYY-MM-DD format) before passing to formatDate
        const formattedDate = formatDate(validDate.toISOString().split("T")[0]); // Use ISO string for format (YYYY-MM-DD)
        const key = `attendance:${reportingGroup}:${formattedDate}`;

        // Get existing data
        const existingDataResult = await getAttendanceFromRedis(
            date,
            reportingGroup
        );
        let existingData = [];

        if (existingDataResult.success) {
            existingData = existingDataResult.data;
        }

        // Check if employee already exists in the data
        const employeeIndex = existingData.findIndex(
            (item) => item.employee_id === employeeId
        );

        if (employeeIndex !== -1) {
            // Update existing employee data
            existingData[employeeIndex] = {
                ...existingData[employeeIndex],
                ...attendanceData,
            };
        } else {
            // Add new employee data
            existingData.push({
                employee_id: employeeId,
                attendance_date: formattedDate,
                ...attendanceData,
            });
        }

        // Save updated data back to Redis
        await redisClient.set(key, JSON.stringify(existingData));

        return {
            success: true,
            message: `Attendance data added to Redis for employee ${employeeId} on ${formattedDate}`,
        };
    } catch (error) {
        console.error("Error adding attendance to Redis:", error);
        return {
            success: false,
            error: error.message,
        };
    }
};

module.exports = {
    checkDataAvailableInRedis,
    getAttendanceFromRedis,
    addAttendanceToRedis,
    getRedisAttendanceData,
    updateRedisAttendanceData,
    deleteRedisGroupKeys,
    checkDataAvailableInRedis,
    makeAttendenceKeyRedis,
    storeAttendanceInRedis,
    getSelectedDateRedisData,
    deleteRedisGroupKeysForSelectedDate,
    getAllAttendenceDataFromRedis,
};
