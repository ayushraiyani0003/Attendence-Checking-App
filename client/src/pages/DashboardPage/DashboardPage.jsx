import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Filter, Download } from 'lucide-react';
import SimplifiedDatePicker from '../AttendancePage/CustomDatePicker';
import { useReportSettings, useViewToggle } from '../../hooks/usedashboard';
import './dashboardStyles.css';

const MistakeDashboard = ({ selectedMonthYear }) => {
  // Custom hooks for dashboard functionality
  const { 
    selectedReportType, 
    setSelectedReportType,
    dateRange, 
    setDateRange,
    employeeType, 
    setEmployeeType,
    reportTypes,
    selectedReportOptions
  } = useReportSettings();

  const { viewType, setViewType, getData, getBars } = useViewToggle();

  return (
    <div className="dashboard-container">
      {/* Main content area */}
      <div className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Mistake Monitoring Dashboard</h1>
          
          <div className="view-controls">
            {/* Selected month display passed from parent */}
            <div className="month-display">
              <span>{selectedMonthYear}</span>
            </div>
            
            {/* View toggle */}
            <div className="view-toggle">
              <button 
                className={`toggle-btn ${viewType === 'Group' ? 'active' : ''}`}
                onClick={() => setViewType('Group')}
              >
                Group View
              </button>
              <button 
                className={`toggle-btn ${viewType === 'Department' ? 'active' : ''}`}
                onClick={() => setViewType('Department')}
              >
                Department View
              </button>
            </div>
          </div>
        </div>
        
        {/* Chart container with horizontal scrolling */}
        <div className="chart-container">
          <h2 className="chart-title">
            {viewType === 'Group' ? 'Mistakes by Reporting Group' : 'Mistakes by Department'}
            <span className="subtitle">For {selectedMonthYear}</span>
          </h2>
          <div className="chart-scroll-container">
            {/* Set a fixed width to ensure horizontal scrolling for many groups */}
            <div className="horizontal-scroll-wrapper">
              <div style={{ width: viewType === 'Group' ? '2000px' : '1200px', height: '90%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }} />
                    {getBars()}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right sidebar for report configuration with increased width */}
      <div className="report-sidebar">
        <div className="report-section">
          <h2 className="section-title">Report Download</h2>
          
          {/* Report Type Selector */}
          <div className="form-group">
            <label className="form-label">Report Type</label>
            <div className="select-wrapper">
              <select 
                className="form-select"
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
              >
                {reportTypes.map(type => (
                  <option key={type.name} value={type.name}>{type.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Date Range Picker */}
          <div className="form-group">
            <label className="form-label">Date Range</label>
            <div className="date-range">
              <SimplifiedDatePicker dateRange={dateRange} setDateRange={setDateRange} />
            </div>
          </div>
          
          {/* Employee Type Filter */}
          <div className="form-group">
            <label className="form-label">Employee Type</label>
            <div className="select-wrapper">
              <select 
                className="form-select"
                value={employeeType}
                onChange={(e) => setEmployeeType(e.target.value)}
              >
                <option value="All Employees">All Employees</option>
                <option value="New Employees">Only New Employees</option>
                <option value="Faulty Employees">Faulty Employees</option>
              </select>
            </div>
          </div>
          
          {/* Dynamic Report Options based on selected report type */}
          <div className="form-group">
            <label className="form-label">Report Options</label>
            <div className="checkbox-group">
              {selectedReportOptions.map(option => (
                <div key={option} className="checkbox-item">
                  <input
                    id={`option-${option}`}
                    type="checkbox"
                    className="checkbox-input"
                  />
                  <label htmlFor={`option-${option}`} className="checkbox-label">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Generate Report Button */}
          <button type="button" className="generate-btn">
            <Download size={16} className="btn-icon" />
            Generate Report
          </button>
        </div>
        
        {/* Additional filters */}
        <div className="advanced-filters">
          <h3 className="filter-title">
            <Filter size={16} className="filter-icon" />
            Advanced Filters
          </h3>
          
          <div className="filter-group">
            <div className="form-group">
              <label className="form-label">Include Matrix Totals</label>
              <div className="select-wrapper">
                <select className="form-select">
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Show Net/OT Difference</label>
              <div className="select-wrapper">
                <select className="form-select">
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Shift Data</label>
              <div className="select-wrapper">
                <select className="form-select">
                  <option>All Shifts</option>
                  <option>Morning Shift</option>
                  <option>Afternoon Shift</option>
                  <option>Night Shift</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MistakeDashboard;