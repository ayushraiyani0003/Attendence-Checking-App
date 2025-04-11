import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Input, Space, message, Tooltip, Modal } from 'antd';
import { 
  SearchOutlined, 
  SaveOutlined, 
  InfoCircleOutlined, 
  ExclamationCircleOutlined, 
  DownloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ArrowsAltOutlined  
} from '@ant-design/icons';
import useEmployeeOrder from '../../hooks/useEmployeeOrder';
import { generateEmployeeExcel } from '../../utils/exportEmployeesList';
import './EmployeeOrderPage.css';

const EmployeeOrderPage = (user) => {
  
  const {
    employees,
    filteredEmployees,
    loading,
    searchText,
    handleSearch,
    reorderEmployees,
    saveOrder,
    isFiltering,
    hasChanges,
    changesCount
  } = useEmployeeOrder(user.userReportingGroup);
  
  const [messageApi, contextHolder] = message.useMessage();
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [movingEmployee, setMovingEmployee] = useState(null);
  const [targetPosition, setTargetPosition] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Add debug state to track changes
  const [debugInfo, setDebugInfo] = useState({ lastAction: 'none', changeCount: 0 });

  // Log employees whenever they change (for debugging)
  // useEffect(() => {
  //   console.log("Filtered employees updated:", 
  //     filteredEmployees.map((e, i) => `${i+1}. ${e.name} (ID: ${e.employee_id})`));
  // }, [filteredEmployees]);

  // Handle move up button click
  const handleMoveUp = useCallback((index) => {
    if (index > 0) {
      // console.log(`Moving up employee at index ${index}`);
      // Move employee up one position
      reorderEmployees(index, index - 1);
      setDebugInfo(prev => ({ 
        lastAction: `Move up from ${index+1} to ${index}`, 
        changeCount: prev.changeCount + 1 
      }));
    }
  }, [reorderEmployees]);

  // Handle move down button click
  const handleMoveDown = useCallback((index) => {
    if (index < filteredEmployees.length - 1) {
      // console.log(`Moving down employee at index ${index}`);
      // Move employee down one position
      reorderEmployees(index, index + 1);
      setDebugInfo(prev => ({ 
        lastAction: `Move down from ${index+1} to ${index+2}`, 
        changeCount: prev.changeCount + 1 
      }));
    }
  }, [reorderEmployees, filteredEmployees.length]);

  // Handle move to specific position
  const handleMoveToPosition = useCallback((index) => {
    if (isFiltering) return;
    
    setMovingEmployee({
      index: index,
      name: filteredEmployees[index].name,
      current: index + 1,
      id: filteredEmployees[index].employee_id
    });
    setTargetPosition('');
    setIsModalVisible(true);
  }, [isFiltering, filteredEmployees]);

  // Handle move modal confirm
  const handleMoveConfirm = useCallback(() => {
    const targetIndex = parseInt(targetPosition, 10) - 1;
    
    if (
      isNaN(targetIndex) || 
      targetIndex < 0 || 
      targetIndex >= filteredEmployees.length ||
      targetIndex === movingEmployee.index
    ) {
      messageApi.error({
        content: 'Please enter a valid position number.',
        duration: 3,
      });
      return;
    }
    
    // console.log(`Moving employee ${movingEmployee.name} from index ${movingEmployee.index} to ${targetIndex}`);
    
    // Perform the move
    reorderEmployees(movingEmployee.index, targetIndex);
    setIsModalVisible(false);
    
    messageApi.success({
      content: `Moved ${movingEmployee.name} to position ${targetPosition}.`,
      duration: 2,
    });
    
    setDebugInfo(prev => ({ 
      lastAction: `Move to position from ${movingEmployee.current} to ${targetPosition}`, 
      changeCount: prev.changeCount + 1 
    }));
  }, [filteredEmployees.length, messageApi, movingEmployee, reorderEmployees, targetPosition]);

  // Handle move modal cancel
  const handleMoveCancel = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  // Handle save button click
  const handleSave = useCallback(() => {
    // console.log("Saving order with changes count:", debugInfo.changeCount);
    const orderData = saveOrder();
    messageApi.success({
      content: 'Employee order saved successfully!',
      duration: 3,
    });
    // console.log('Final order data:', orderData);
    
    setDebugInfo(prev => ({ 
      lastAction: `Saved all changes (${prev.changeCount})`, 
      changeCount: 0 
    }));
    
    // No forced reload - employees will stay in their current positions
  }, [debugInfo.changeCount, messageApi, saveOrder]);

  // Handle download button click
  const handleDownload = useCallback(() => {
    setDownloadLoading(true);
    try {
      // Use the filteredEmployees array directly
      const dataToExport = isFiltering ? filteredEmployees : employees;
      
      // Generate and download the Excel file
      generateEmployeeExcel(dataToExport);
      
      messageApi.success({
        content: 'Excel file generated successfully!',
        duration: 3,
      });
      
      setDebugInfo(prev => ({ ...prev, lastAction: `Downloaded excel` }));
    } catch (error) {
      console.error('Error generating Excel file:', error);
      messageApi.error({
        content: 'Failed to generate Excel file. Please try again.',
        duration: 3,
      });
    } finally {
      setDownloadLoading(false);
    }
  }, [employees, filteredEmployees, isFiltering, messageApi]);

  // Prompt to save changes when navigating away
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        // Standard way to show a confirmation dialog when leaving the page
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Table columns configuration with enhanced action column
  const columns = [
    {
      title: 'Sr No.',
      dataIndex: 'index',
      width: 80,
      render: (_, __, index) => index + 1,
      align: 'center',
    },
    {
      title: 'Punch Code',
      dataIndex: 'punch_code',
      width: 150,
      render: (text) => <span className="emp-order-punch-code">{text}</span>,
      align: 'center',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      width: 380,
      align: 'center',
      render: (text, record) => (
        <span title={`ID: ${record.employee_id}, Order: ${record.displayOrder}`}>
          {text}
        </span>
      )
    },
    {
      title: 'Department',
      dataIndex: 'department',
      width: 180,
      align: 'center',
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      width: 200,
      align: 'center',
    },
    {
      title: 'Reporting Group',
      dataIndex: 'reporting_group',
      width: 200,
      align: 'center',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record, index) => (
        <Space size="small">
          <Button
            type="text"
            icon={<ArrowUpOutlined />}
            onClick={() => handleMoveUp(index)}
            disabled={isFiltering || index === 0}
            className="move-button"
            title="Move Up"
          />
          <Button
            type="text"
            icon={<ArrowDownOutlined />}
            onClick={() => handleMoveDown(index)}
            disabled={isFiltering || index === filteredEmployees.length - 1}
            className="move-button"
            title="Move Down"
          />
          <Button
            type="text"
            icon={<ArrowsAltOutlined />}
            onClick={() => handleMoveToPosition(index)}
            disabled={isFiltering}
            className="move-button"
            title="Move To Position"
          />
        </Space>
      ),
      align: 'center',
    },
  ];

  return (
    <div className="employee-order-container">
      {contextHolder}
      
      <div className="employee-order-header">
        <div className="employee-header-title">
          <h1>Employee Order Management</h1>
          <Tooltip title="Use the arrow buttons to reorder employees or the move button to place an employee at a specific position">
            <InfoCircleOutlined className="info-icon" />
          </Tooltip>
        </div>
        
        <div className="header-actions">
          <Space>
            <Input
              placeholder="Search employees..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
              allowClear
            />
            <Button 
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              disabled={isFiltering}
              className={`save-button ${hasChanges ? 'save-button-highlight' : ''}`}
            >
              Save Order {debugInfo.changeCount > 0 ? `(${debugInfo.changeCount} changes)` : ''}
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              loading={downloadLoading}
              className="download-button"
            >
              Download
            </Button>
          </Space>
        </div>
      </div>
      
      <div className="employee-table-wrapper">
        <div className="table-container">
          <Table
            dataSource={filteredEmployees}
            columns={columns}
            pagination={false}
            loading={loading}
            className="employee-table"
            bordered={false}
            size="middle"
            showHeader={true}
            scroll={{ y: false, x: 'max-content' }}
            rowKey={(record) => record.employee_id || record.id}
            rowClassName={(record, index) => 
              `employee-row${record.displayOrder !== index + 1 ? ' changed-row' : ''}`}
          />
        </div>
        
        {isFiltering && (
          <div className="filtering-message">
            <InfoCircleOutlined /> Reordering is disabled while filtering. Clear the search to reorder employees.
          </div>
        )}
        
        {hasChanges && !isFiltering && (
          <div className="changes-message">
            <InfoCircleOutlined /> You have unsaved changes. Don't forget to save your order.
            {debugInfo.changeCount > 0 && ` (${debugInfo.changeCount} changes)`}
          </div>
        )}
      </div>
      
      {/* Move to Position Modal */}
      <Modal
        title="Move Employee to Specific Position"
        open={isModalVisible}
        onOk={handleMoveConfirm}
        onCancel={handleMoveCancel}
        okText="Move"
        cancelText="Cancel"
      >
        {movingEmployee && (
          <>
            <p>Moving: <strong>{movingEmployee.name}</strong></p>
            <p>Current Position: {movingEmployee.current}</p>
            <p>Enter new position (1-{filteredEmployees.length}):</p>
            <Input
              type="number"
              value={targetPosition}
              onChange={(e) => setTargetPosition(e.target.value)}
              min={1}
              max={filteredEmployees.length}
              placeholder="Enter position number"
              autoFocus
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default EmployeeOrderPage;