const attendanceService = require('../services/attendenceService');
const metricsService = require('../services/metricsService');

// Get graph data for the dashboard
exports.getDashboardGraphs = [ async (req, res) => {
  try {
    // Get month and year from the request query
    const { month, year } = req.query;
    
    // Validate input
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year parameters are required"
      });
    }
    
    // Get raw dashboard data using helper function
    const rawData = await getData(parseInt(month), parseInt(year));
    
    // Format data in the required structure
    const formattedData = formatDashboardData(rawData);
    
    // Return successful response with data
    return res.status(200).json({
      success: true,
      data: formattedData
    });
    
  } catch (error) {
    console.error("Error fetching dashboard graph data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message
    });
  }
}];

// Format dashboard data in the required structure
const formatDashboardData = (rawData) => {
  // Extract employees from attendance data
  const allEmployees = [];
  rawData.attendance.byGroup.forEach(group => {
    group.records.forEach(record => {
      if (!allEmployees.includes(record.employee_id)) {
        allEmployees.push(record.employee_id);
      }
    });
  });
  
  // Get departments from employees
  const departmentCounts = {};
  const reportingGroupCounts = {};
  
  // Count employees by department and reporting group
  rawData.attendance.byGroup.forEach(group => {
    // Initialize reporting group count
    const groupName = group.groupName;
    reportingGroupCounts[groupName] = 0;
    
    // Process unique employees in this group
    const processedEmployees = new Set();
    
    group.records.forEach(record => {
      // Only count each employee once
      if (!processedEmployees.has(record.employee_id)) {
        processedEmployees.add(record.employee_id);
        
        // Increment reporting group count
        reportingGroupCounts[groupName]++;
        
        // Get employee department
        // Note: This assumes the department info is in the record
        // You may need to fetch this info separately if not available
        const department = record.department || 'Unknown';
        
        // Increment department count
        if (!departmentCounts[department]) {
          departmentCounts[department] = 0;
        }
        departmentCounts[department]++;
      }
    });
  });
  
  // Format departments and reporting groups as arrays of objects
  const departmentsArray = Object.entries(departmentCounts).map(([key, value]) => {
    return { [key]: value };
  });
  
  const reportingGroupsArray = Object.entries(reportingGroupCounts).map(([key, value]) => {
    return { [key]: value };
  });
  
  // Return the formatted data
  return {
    departments: departmentsArray,
    reporting_groups: reportingGroupsArray,
    // Keep the chart data as is
    charts: {
      attendance: rawData.attendance,
      metrics: rawData.metrics,
      period: rawData.period
    }
  };
};

// Helper function to get dashboard data
const getData = async (month, year) => {
  try {
    // 1. First, get all reporting groups from settings
    const reportingGroups = await db.ReportingGroup.findAll();
    const reportingGroupIds = reportingGroups.map(group => group.id);
    
    // 2. Get employees attendance data for the month by reporting groups
    const attendanceData = await attendanceService.getEmployeesAttendanceByMonthAndGroup(
      reportingGroupIds, 
      year, 
      month
    );
    
    // 3. Get metrics data for the month
    const metricsData = await metricsService.fetchMetricsForMonthYear(month, year);
    
    // 4. Process and organize the data for dashboard visualization
    // Group attendance by reporting group for analysis
    const attendanceByGroup = attendanceData.reduce((groups, record) => {
      const groupId = record.reporting_group;
      if (!groups[groupId]) {
        groups[groupId] = [];
      }
      groups[groupId].push(record);
      return groups;
    }, {});
    
    // Map reporting group IDs to names for better readability
    const groupNameMap = reportingGroups.reduce((map, group) => {
      map[group.id] = group.name;
      return map;
    }, {});
    
    // Create formatted response object with both attendance and metrics data
    return {
      attendance: {
        byGroup: Object.keys(attendanceByGroup).map(groupId => ({
          groupId,
          groupName: groupNameMap[groupId] || 'Unknown Group',
          records: attendanceByGroup[groupId],
          summary: summarizeAttendanceData(attendanceByGroup[groupId])
        })),
        overall: summarizeAttendanceData(attendanceData)
      },
      metrics: metricsData,
      reportingGroups: reportingGroups,
      period: {
        month,
        year
      }
    };
    
  } catch (error) {
    console.error("Error in getData function:", error);
    throw error;
  }
};

// Helper function to summarize attendance data
const summarizeAttendanceData = (attendanceRecords) => {
  if (!attendanceRecords || attendanceRecords.length === 0) {
    return {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      presentPercentage: 0,
      latePercentage: 0
    };
  }
  
  // Count different attendance statuses
  const counts = attendanceRecords.reduce((acc, record) => {
    if (record.status === 'Present') {
      acc.presentDays++;
      if (record.is_late) {
        acc.lateDays++;
      }
    } else if (record.status === 'Absent') {
      acc.absentDays++;
    }
    return acc;
  }, { presentDays: 0, absentDays: 0, lateDays: 0 });
  
  const totalDays = attendanceRecords.length;
  
  return {
    totalDays,
    presentDays: counts.presentDays,
    absentDays: counts.absentDays,
    lateDays: counts.lateDays,
    presentPercentage: (counts.presentDays / totalDays) * 100,
    latePercentage: (counts.lateDays / totalDays) * 100
  };
};

// Get dashboard reports - Keep as is
exports.getDashboardReports = [ async (req, res) => {
  // Implementation unchanged
  // ...
}];

module.exports = exports;