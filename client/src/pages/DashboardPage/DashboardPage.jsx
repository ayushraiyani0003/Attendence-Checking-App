import React, { useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, RefreshCw, Check, XCircle } from 'lucide-react';
import SimplifiedDatePicker from '../AttendancePage/CustomDatePicker';
import { useReportSettings, useViewToggle } from '../../hooks/useDashboard';
import { useDashboardContext } from '../../context/DashboardContext';
import './dashboardStyles.css';

// Array of colors for the bars
const COLORS = [
  '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', 
  '#d0ed57', '#ffc658', '#ff8042', '#ff6b6b', '#c9b3ff',
  '#86cfa3', '#ffb367', '#bb86fc', '#03dac6', '#ff6e86'
];

const MistakeDashboard = ({ selectedMonthYear }) => {
  // Track if this is the first render
  const isFirstRender = useRef(true);
  
  // Get context values
  const { selectedMonth, updateSelectedMonth } = useDashboardContext();
  
  // Update context with selected month when prop changes
  useEffect(() => {
    // Only update if the prop exists and is different from context
    if (selectedMonthYear && selectedMonthYear !== selectedMonth) {
      console.log(`[MistakeDashboard] Updating month from prop: ${selectedMonthYear}`);
      updateSelectedMonth(selectedMonthYear);
    }
    // If no prop is provided but we're on first render, use the context's value
    else if (isFirstRender.current && selectedMonth) {
      console.log(`[MistakeDashboard] Using context month: ${selectedMonth}`);
    }
    
    isFirstRender.current = false;
  }, [selectedMonthYear, selectedMonth, updateSelectedMonth]);
  
  // The current month to use (guaranteed to have a value from context)
  const currentMonth = selectedMonth;
  
  console.log(`[MistakeDashboard] Rendering with month: ${currentMonth}`);
  
  // Now use hooks with the effective month value
  const { 
    selectedReportType, 
    setSelectedReportType,
    dateRange, 
    setDateRange,
    employeeType, 
    setEmployeeType,
    reportTypes,
    availableReportOptions,
    selectedOptions,
    toggleOption,
    selectAllOptions,
    deselectAllOptions,
    isLoading: reportLoading,
    generateReport,
    open,
          setOpen,
          handleChange,
          dayjsDateRange,
  } = useReportSettings(currentMonth);

  const { 
    getData, 
    isLoading: viewLoading,
    refreshData 
  } = useViewToggle(currentMonth);

  // Handle refresh button click
  const handleRefresh = () => {
    console.log(`[MistakeDashboard] Refreshing data for month: ${currentMonth}`);
    refreshData();
  };

  const isLoading = reportLoading || viewLoading;
  const chartData = getData();
  
  // Log chart data for debugging
  console.log('[MistakeDashboard] Chart data:', chartData);

  // Custom tooltip component with enhanced styling
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <div className="tooltip-header">
            <div className="tooltip-color-indicator" style={{ backgroundColor: payload[0].color }}></div>
            <h4 className="tooltip-label">{label}</h4>
          </div>
          <div className="tooltip-content">
            <p className="tooltip-value">
              <strong>Mismatch Count:</strong> {payload[0].value}
            </p>
            <p className="tooltip-help">
              Mismatches between attendance and metrics data
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Bar shape with rounded corners
  const RoundedBar = (props) => {
    const { x, y, width, height, fill } = props;
    const radius = 8;
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          rx={radius}
          ry={radius}
        />
      </g>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Main content area */}
      <div className="main-content">
        {/* Chart container with horizontal scrolling */}
        <div className="chart-container">
          <h2 className="chart-title">
            Attendance Mismatches by Group
            <span className="subtitle">For {currentMonth || "Current Month"}</span>
            
            {/* Add refresh button */}
            <button 
              className="refresh-button" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </h2>
          
          {isLoading ? (
            <div className="loading-indicator">Loading dashboard data...</div>
          ) : chartData.length === 0 ? (
            <div className="no-data-message">No mismatch data available for this period</div>
          ) : (
            <div className="chart-scroll-container">
              {/* Set a fixed width to ensure horizontal scrolling for many groups */}
              <div className="horizontal-scroll-wrapper">
                <div style={{ width: Math.max(600, chartData.length * 100), height: '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 90 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80} 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        label={{ 
                          value: 'Number of Mismatches', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle' } 
                        }}
                      />
                      <Tooltip 
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                      />
                      <Bar 
                        dataKey="mistakes" 
                        name="Mismatches" 
                        shape={<RoundedBar />}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Summary section */}
        <div className="summary-section">
          <h3>Data Summary</h3>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-title">Total Mismatches</div>
              <div className="card-value">
                {isLoading ? '...' : chartData.reduce((sum, item) => sum + item.mistakes, 0)}
              </div>
            </div>
            <div className="summary-card">
              <div className="card-title">Groups with Errors</div>
              <div className="card-value">
                {isLoading ? '...' : chartData.filter(item => item.mistakes > 0).length}
              </div>
            </div>
            <div className="summary-card">
              <div className="card-title">Highest Error Count</div>
              <div className="card-value">
                {isLoading ? '...' : (chartData.length > 0 ? Math.max(...chartData.map(item => item.mistakes)) : 0)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right sidebar for report configuration */}
      <div className="report-sidebar">
        <div className="report-section">
          <div className="section-header">
            <Download size={20} className="section-icon" />
            <h2 className="section-title">Report Download</h2>
          </div>
          
          <div className="section-content">
            
            {/* Report Type Selector with enhanced UI */}
            <div className="form-group">
              <label className="form-label">Report Type</label>
              <div className="select-wrapper fancy-select">
                <select 
                  className="form-select"
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  disabled={reportLoading}
                >
                  {reportTypes.map(type => (
                    <option key={type.name} value={type.name}>{type.name}</option>
                  ))}
                </select>
                <div className="select-arrow"></div>
              </div>
            </div>
            
            {/* Date Range Picker with enhanced styling */}
            <div className="form-group">
              <label className="form-label">
                <div className="label-with-info">
                  Date Range
                  <span className="info-tooltip" title="Select date range for your report">ⓘ</span>
                </div>
              </label>
              <div className="date-range enhanced-date-picker">
                <SimplifiedDatePicker 
                  dateRange={dateRange} 
                  setDateRange={setDateRange} 
                  disabled={reportLoading} 
                  open={open}
                  setOpen={setOpen}
                  handleChange={handleChange}
                  dayjsDateRange={dayjsDateRange}
                />
              </div>
            </div>
            
            {/* Employee Type Filter with icons */}
            <div className="form-group">
              <label className="form-label">Employee Type</label>
              <div className="select-wrapper fancy-select">
                <select 
                  className="form-select"
                  value={employeeType}
                  onChange={(e) => setEmployeeType(e.target.value)}
                  disabled={reportLoading}
                >
                  <option value="All Employees">All Employees</option>
                  <option value="New Employees">Only New Employees</option>
                  <option value="Faulty Employees">Employees with Errors</option>
                </select>
                <div className="select-arrow"></div>
              </div>
            </div>
            
            {/* Report Options with Select All/None controls */}
            {availableReportOptions.length > 0 && (
              <div className="form-group">
                <label className="form-label">Report Options</label>
                
                {/* Select All/None buttons */}
                <div className="option-controls">
                  <button 
                    type="button" 
                    onClick={selectAllOptions}
                    className="option-control-btn select-all-btn"
                    disabled={reportLoading}
                  >
                    <Check size={14} />
                    <span>Select All</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={deselectAllOptions}
                    className="option-control-btn select-none-btn"
                    disabled={reportLoading}
                  >
                    <XCircle size={14} />
                    <span>Select None</span>
                  </button>
                </div>
                
                {/* Dynamic Report Options with enhanced checkbox styling */}
                <div className="checkbox-group">
                  {availableReportOptions.map((option) => (
                    <div key={option} className="checkbox-item">
                      <input
                        id={`option-${option}`}
                        type="checkbox"
                        className="checkbox-input"
                        checked={selectedOptions[option] || false}
                        onChange={() => toggleOption(option)}
                        disabled={reportLoading}
                      />
                      <label htmlFor={`option-${option}`} className="checkbox-label">
                        <span className="checkbox-custom"></span>
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Generate Report Button with animation */}
          <button 
            type="button" 
            className="generate-btn pulse-animation"
            onClick={generateReport}
            disabled={reportLoading}
          >
            <Download size={16} className="btn-icon" />
            <span>{reportLoading ? 'Generating...' : 'Generate Report'}</span>
            {reportLoading && <div className="loader"></div>}
          </button>
        </div>
        
        {/* Recently Generated Reports Section */}
        <div className="recent-reports">
          <h3 className="recent-reports-title">
            <svg viewBox="0 0 24 24" width="18" height="18" className="history-icon">
              <path fill="currentColor" d="M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3" />
            </svg>
            Recent Reports
          </h3>
          <div className="report-list">
            <div className="report-list-item">
              <div className="report-info">
                <span className="report-name">Full Error Report</span>
                <span className="report-date">Apr 4, 2025</span>
              </div>
              <button className="download-report-btn">
                <Download size={14} />
              </button>
            </div>
            <div className="report-list-item">
              <div className="report-info">
                <span className="report-name">Employee Summary</span>
                <span className="report-date">Apr 2, 2025</span>
              </div>
              <button className="download-report-btn">
                <Download size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .refresh-button {
          display: flex;
          align-items: center;
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .refresh-button:hover:not(:disabled) {
          background-color: #e9e9e9;
        }
        
        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .refresh-button svg {
          margin-right: 6px;
        }
        
        .current-month-display {
          background-color: #f8f9fa;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 15px;
          font-size: 0.9rem;
        }
        
        .month-label {
          color: #666;
        }
        
        .month-value {
          font-weight: 600;
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default MistakeDashboard;