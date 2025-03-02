// utils/constants.js
require('dotenv').config(); // Make sure to load .env variables

module.exports = {
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || 'default_secret_key', // Fallback in case of missing env variable
};
