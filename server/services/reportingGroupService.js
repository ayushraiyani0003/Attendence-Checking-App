// services/reportingGroupService.js
const { ReportingGroup } = require('../models');

async function getAllReportingGroups() {
  try {
    // Fetch all reporting group data
    return await ReportingGroup.findAll();
  } catch (error) {
    throw new Error('Error fetching reporting group data');
  }
}

module.exports = {
  getAllReportingGroups,
};
