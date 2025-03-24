const redisClient = require('../config/redisConfig');

// Function to get all attendance for a given month and year
async function getRedisAttendanceData(year, month, groups) {
    const startDate = new Date(year, month - 1, 1); // First date of the month
    const endDate = new Date(year, month, 0); // Last date of the month
    const result = [];

    // Loop through all the groups
    for (const group of groups) {
        // Loop through all the days of the month
        for (let day = startDate.getDate(); day <= endDate.getDate(); day++) {
            const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const key = `attendance:${group}:${date}`;

            // Log the key for debugging
            console.log(key);

            try {
                // Await the Redis GET operation
                const data = await redisClient.get(key); // Fetch the data from Redis
                
                if (data) {
                    result.push({ group, date, data }); // Add group, date, and data to the result if it exists
                }
            } catch (err) {
                console.error(`Error fetching data for ${group} on ${date}:`, err);
            }
        }
    }

    return result;
}

module.exports = { getRedisAttendanceData };
