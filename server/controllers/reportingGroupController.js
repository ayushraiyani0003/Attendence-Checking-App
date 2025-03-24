const ReportingGroupService = require('../services/reportingGroupService');
const { AttendanceDateLockStatus } = require('../models');

module.exports = {
  async getReportingGroupData() {
    try {
      // Fetch all reporting group data from the database
      const reportingGroupData = await ReportingGroupService.getAllReportingGroups();

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      console.log(`Processing attendance lock status for date: ${today}`);

      // Loop through each reporting group
      for (const group of reportingGroupData) {
        // Check if an entry already exists for this group and date
        const existingRecord = await AttendanceDateLockStatus.findOne({
          where: {
            reporting_group_name: group.groupname,
            attendance_date: today
          }
        });

        // If record doesn't exist, create a new one
        if (!existingRecord) {
          console.log(`Creating new lock status for group: ${group.groupname}`);
          await AttendanceDateLockStatus.create({
            reporting_group_name: group.groupname,
            attendance_date: today,
            status: 'unlocked',
            locked_by: "",
          });
        } else {
          console.log(`Lock status already exists for group: ${group.groupname} on date: ${today}`);
          // Optionally, you can update the existing record if needed
          // await existingRecord.update({ status: 'unlocked', locked_by: "" });
        }
      }

      console.log('Attendance lock status processed successfully for all reporting groups!');
    } catch (error) {
      console.error('Error processing attendance lock status:', error);
    }
  },
};