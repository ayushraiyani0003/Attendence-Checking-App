const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const routes = require('./routes');
const { initWebSocket } = require('./utils/websocketUtils');
const sequelize = require('./config/db');
const cronJobs = require('./utils/cronJobs'); // Import your cron job file here

const app = express();
const server = http.createServer(app);

// CORS settings
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

initWebSocket(server);  // Initialize WebSocket server

// DB connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    sequelize.sync({ alter: true }).then(() => {
      console.log('Database synchronized');
    }).catch((err) => {
      console.error('Error syncing database:', err);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

// API routes
app.use('/api', routes);

server.listen(5003, () => {
  console.log('Server running on http://localhost:5003');
});
