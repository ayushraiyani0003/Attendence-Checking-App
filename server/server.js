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

// Create server with increased timeout settings
const server = http.createServer(app);
server.timeout = 120000; // 2 minutes timeout
server.keepAliveTimeout = 60000; // 1 minute keep-alive

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
app.use(express.json({ limit: '10mb' })); // Increased JSON body limit

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Server is running');
});

// Initialize WebSocket server with error handling
const wss = initWebSocket(server);
console.log('WebSocket server initialized');

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

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`WebSocket server available at ws://${HOST}:${PORT}`);
});