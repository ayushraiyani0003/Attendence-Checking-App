const ReportingGroupService = require('../services/reportingGroupService');
const { AttendanceDateLockStatus } = require('../models'); // Import the AttendanceDateLockStatus model

module.exports = {
  async getReportingGroupData() {
    try {
      // Fetch all reporting group data from the database
      const reportingGroupData = await ReportingGroupService.getAllReportingGroups();

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Loop through each reporting group and create a new entry in AttendanceDateLockStatus
      for (const group of reportingGroupData) {
        await AttendanceDateLockStatus.create({
          reporting_group_name: group.groupname,  // Group name fetched from the reporting group data
          attendance_date: today,                // Today's date
          status: 'unlocked',                    // Default status set to 'unlocked'
          locked_by: "",                         // 'locked_by' is set to an empty string
        });
      }

      console.log('Attendance records unlocked successfully for all reporting groups!');
    } catch (error) {
      console.error('Error fetching reporting group data or inserting into AttendanceDateLockStatus:', error);
    }
  },
};
