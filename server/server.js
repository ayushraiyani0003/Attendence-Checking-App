const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
require('dotenv').config(); // Make sure to load .env variables
const cors = require('cors');
const routes = require('./routes');
const { initWebSocket } = require('./utils/websocketUtils');
const sequelize = require('./config/db');
const cronJobs = require('./utils/cronJobs');

const app = express();
const server = http.createServer(app);

// Get port from environment variable, with 5003 as fallback
const PORT = process.env.SERVER_PORT || 5003;
const HOST = process.env.HOST || 'localhost';

// CORS settings
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

initWebSocket(server); // Initialize WebSocket server

// DB connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Database synchronized');
  })
  .catch((err) => {
    console.error('Error connecting or syncing database:', err);
  });

// API routes
app.use('/api', routes);

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});