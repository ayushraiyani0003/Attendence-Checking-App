const { createClient } = require('@redis/client');

// Create Redis client instance with options
const redisClient = createClient({
  url: 'redis://127.0.0.1:6379',
});

// Event listeners for Redis client
redisClient.on('connect', () => {
  console.log('Connected to Redis...');
});

redisClient.on('error', (err) => {
  console.error('Error connecting to Redis:', err);
});

// Initialize connection
(async () => {
  try {
    await redisClient.connect();
    console.log('Redis client connected successfully');
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
})();

// Export the redisClient for use in other parts of the application
module.exports = redisClient;