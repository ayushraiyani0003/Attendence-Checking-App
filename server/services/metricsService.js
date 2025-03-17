const fs = require("fs");
const path = require("path");
const Metrics = require("../models/metricsModel");
const { parseCSVFile, parseOTFile } = require("../utils/fileUtils");

// Process the uploaded files and save data to the database
const processMetricsFiles = async (networkFile, otFile, monthYear) => {
  // Parse Network Hours and OT Hours files
  const networkData = await parseCSVFile(networkFile); // Parse the network hours CSV
  const otData = await parseOTFile(otFile); // Parse the OT hours CSV

  // Generate metric ID based on monthYear and punchCode
  const metricId = `${monthYear.slice(0, 2)}${monthYear.slice(3, 7)}s${
    networkData[0].punch_code
  }`;

  // Store data in the database
  const metricsData = await Metrics.create({
    punch_code: networkData[0].punch_code,
    month_year: monthYear,
    network_hours: JSON.stringify(networkData),
    overtime_hours: JSON.stringify(otData),
  });

  return metricsData;
};

module.exports = {
  processMetricsFiles,
};
