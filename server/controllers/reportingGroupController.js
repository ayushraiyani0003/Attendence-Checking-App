const ReportingGroupService = require('../services/reportingGroupService');
const { AttendanceDateLockStatus } = require('../models');

module.exports = {
  async getReportingGroupData() {
    try {
      // Fetch all reporting group data from the database
      const reportingGroupData = await ReportingGroupService.getAllReportingGroups();

      // Get current UTC time
      const currentDate = new Date();

      // Convert UTC time to IST by adding 5 hours and 30 minutes (IST = UTC + 5:30)
      const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
      const istDate = new Date(currentDate.getTime() + istOffset);

      // Get yesterday's date (IST)
      istDate.setDate(istDate.getDate() - 1);
      const yesterday = istDate.toISOString().split('T')[0];
      console.log(`Processing attendance lock status for yesterday's date: ${yesterday}`);

      // Loop through each reporting group
      for (const group of reportingGroupData) {
        // Check if an entry already exists for this group and yesterday
        const existingRecordYesterday = await AttendanceDateLockStatus.findOne({
          where: {
            reporting_group_name: group.groupname,
            attendance_date: yesterday
          }
        });

        // If record doesn't exist for yesterday, create a new one
        if (!existingRecordYesterday) {
          console.log(`Creating new lock status for group: ${group.groupname} on date: ${yesterday}`);
          await AttendanceDateLockStatus.create({
            reporting_group_name: group.groupname,
            attendance_date: yesterday,
            status: 'unlocked',
            locked_by: "",
          });
        } else {
          console.log(`Lock status already exists for group: ${group.groupname} on date: ${yesterday}`);
        }
      }

      console.log('Attendance lock status processed successfully for all reporting groups!');
    } catch (error) {
      console.error('Error processing attendance lock status:', error);
    }
  },
};
