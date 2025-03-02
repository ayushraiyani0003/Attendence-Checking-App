const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { authenticateJWT } = require('./middlewares/authMiddleware'); // Import the authentication middleware
const routes = require('./routes');  // Import centralized routes
const sequelize = require('./config/db');  // Import the sequelize instance to connect to DB

const app = express();

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:3000',  // Allow only requests from this origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Allow only these methods
  allowedHeaders: ['Content-Type', 'Authorization'],  // Specify allowed headers
  credentials: true,  // Enable cookies to be sent in cross-origin requests
};

app.use(cors(corsOptions));  // Apply the CORS middleware with the above options

app.use(cookieParser()); // For handling cookies
app.use(express.json()); // Built-in Express middleware for parsing JSON request bodies

// Test DB connection and sync
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    sequelize.sync({ alter: true })  // Modify the schema without losing data
      .then(() => {
        console.log('Database synchronized');
      })
      .catch((err) => {
        console.error('Error syncing database:', err);
      });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  });

// Use routes
app.use('/api', routes);  // Use /api as base route for all APIs

// Start the server after the DB is successfully connected
app.listen(5003, () => {
  console.log('Server is running on http://localhost:5003');
});
