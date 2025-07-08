require("dotenv").config(); // Add this line to load environment variables

const { Sequelize } = require("sequelize");

// Create a new Sequelize instance with your MySQL database credentials
const sequelize = new Sequelize(
    process.env.DB_NAME, // Database name
    process.env.DB_USER, // Database username
    process.env.DB_PASSWORD, // Database password
    {
        host: process.env.DB_HOST, // MySQL host
        dialect: "mysql", // Dialect for the database (MySQL)
        logging: false, // Disable logging to console for cleaner output (optional)
        pool: {
            max: 5, // Maximum number of connections in pool
            min: 0, // Minimum number of connections in pool
            acquire: 30000, // Maximum time, in milliseconds, that pool will try to get connection before throwing error
            idle: 10000, // Maximum time, in milliseconds, that a connection can be idle before being released
        },
    }
);

// Test the connection (optional but good practice)
sequelize
    .authenticate()
    .then(() => {
        //console.log('Database connection successful!');
    })
    .catch((err) => {
        console.error("Unable to connect to the database:", err);
    });

module.exports = sequelize;
