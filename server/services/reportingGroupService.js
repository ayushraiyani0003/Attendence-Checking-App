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
const getAllGroupNames = async () => {
  try {
    const groups = await ReportingGroup.findAll({
      attributes: ['groupname'],
      order: [['groupname', 'ASC']]
    });
    
    // Extract just the groupname values into an array
    return groups.map(group => group.groupname);
  } catch (error) {
    console.error('Error fetching reporting groups:', error);
    throw new Error('Failed to fetch reporting groups');
  }
};


module.exports = {
  getAllReportingGroups,
  getAllGroupNames
};
