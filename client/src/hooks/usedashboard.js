import { useState } from 'react';
import { Bar } from 'recharts';

// Generate sample data with many groups (30+)
const generateGroupData = () => {
  const groups = [];
  // Create 30+ groups
  for (let i = 1; i <= 35; i++) {
    groups.push({
      name: `Group ${i}`,
      mistakes: Math.floor(Math.random() * 20) + 1, // 1-20 mistakes
    });
  }
  return groups;
};

// Generate sample data for departments
const generateDepartmentData = () => {
  const departments = [
    { name: 'HR', mistakes: Math.floor(Math.random() * 30) + 10 },
    { name: 'Finance', mistakes: Math.floor(Math.random() * 30) + 10 },
    { name: 'Operations', mistakes: Math.floor(Math.random() * 30) + 10 },
    { name: 'IT', mistakes: Math.floor(Math.random() * 30) + 10 },
    { name: 'Marketing', mistakes: Math.floor(Math.random() * 30) + 10 },
    { name: 'Sales', mistakes: Math.floor(Math.random() * 30) + 10 },
    { name: 'R&D', mistakes: Math.floor(Math.random() * 30) + 10 },
    { name: 'Customer Support', mistakes: Math.floor(Math.random() * 30) + 10 },
    { name: 'Legal', mistakes: Math.floor(Math.random() * 30) + 10 },
    { name: 'Administration', mistakes: Math.floor(Math.random() * 30) + 10 }
  ];
  return departments;
};

// Sample group and department data
const mistakeDataByGroup = generateGroupData();
const mistakeDataByDepartment = generateDepartmentData();

// Report types and their specific options
const reportTypeOptions = [
  { name: 'Monthly Summary', options: ['Count', 'Hours', 'Remarks'] },
  { name: 'Department Analysis', options: ['Matrix Totals', 'Net/OT Difference'] },
  { name: 'Shift Report', options: ['Morning', 'Afternoon', 'Night'] },
  { name: 'Detailed Group Report', options: ['Individual Errors', 'Trend Analysis', 'Improvement Metrics'] }
];

// Hook for report settings management
export const useReportSettings = () => {
  const [selectedReportType, setSelectedReportType] = useState('Monthly Summary');
  const [dateRange, setDateRange] = useState({ start: '2025-04-01', end: '2025-04-30' });
  const [employeeType, setEmployeeType] = useState('All Employees');
  
  // Get selected report options based on report type
  const selectedReportOptions = reportTypeOptions.find(
    r => r.name === selectedReportType
  )?.options || [];

  return {
    selectedReportType,
    setSelectedReportType,
    dateRange,
    setDateRange,
    employeeType,
    setEmployeeType,
    reportTypes: reportTypeOptions,
    selectedReportOptions
  };
};

// Hook for view toggling and data management
export const useViewToggle = () => {
  const [viewType, setViewType] = useState('Group');

  // Get data based on current view type
  const getData = () => {
    return viewType === 'Group' ? mistakeDataByGroup : mistakeDataByDepartment;
  };

  // Get bars based on current view type - now using a consistent gray color palette
  const getBars = () => {
    if (viewType === 'Group') {
      return [
        <Bar key="mistakes" dataKey="mistakes" fill="#6b7280" name="Mistakes" />
      ];
    } else {
      return [
        <Bar key="mistakes" dataKey="mistakes" fill="#6b7280" name="Mistakes" />
      ];
    }
  };

  return {
    viewType,
    setViewType,
    getData,
    getBars
  };
};