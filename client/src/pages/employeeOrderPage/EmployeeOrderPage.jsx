import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Space, message, Tooltip, Modal } from 'antd';
import { SearchOutlined, SaveOutlined, InfoCircleOutlined, ExclamationCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { sortableContainer, sortableElement } from 'react-sortable-hoc';
import useEmployeeOrder from '../../hooks/useEmployeeOrder';
import { generateEmployeeExcel } from '../../utils/exportEmployeesList'; // Import the simplified excel export utility
import './EmployeeOrderPage.css';

// Create a sortable row element
const SortableRow = sortableElement(props => <tr {...props} />);

// Create a sortable container for the table body
const SortableContainer = sortableContainer(props => <tbody {...props} />);

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
    hasChanges
  } = useEmployeeOrder(user.userReportingGroup);
  
  const [messageApi, contextHolder] = message.useMessage();
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Handler for sort end event
  const onSortEnd = ({ oldIndex, newIndex }) => {
    if (oldIndex !== newIndex) {
      reorderEmployees(oldIndex, newIndex);
    }
  };

  // Handle save button click
  const handleSave = () => {
    const orderData = saveOrder();
    messageApi.success({
      content: 'Employee order saved successfully!',
      duration: 3,
    });
    console.log('Final order data:', orderData);
  };

  // Handle download button click - SIMPLIFIED APPROACH
  const handleDownload = () => {
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
    } catch (error) {
      console.error('Error generating Excel file:', error);
      messageApi.error({
        content: 'Failed to generate Excel file. Please try again.',
        duration: 3,
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  // Prompt to save changes when navigating away
  useEffect(() => {
    const handleNavigation = () => {
      if (hasChanges) {
        Modal.confirm({
          title: 'Save Changes?',
          icon: <ExclamationCircleOutlined />,
          content: 'You have unsaved changes to the employee order. Would you like to save before leaving?',
          okText: 'Save',
          cancelText: 'Discard',
          onOk: handleSave,
        });
      }
    };

    // This would need to be integrated with your router's navigation events
    // For example, with react-router: history.block(handleNavigation)
    // For simplicity, we'll just simulate this with an unmount effect
    return () => {
      if (hasChanges) {
        // In a real app, you would use your router's navigation system
        // This simple prompt won't work in modern browsers due to security,
        // but illustrates the concept
        const wantToSave = window.confirm('You have unsaved changes. Do you want to save before leaving?');
        if (wantToSave) {
          handleSave();
        }
      }
    };
  }, [hasChanges]);

  // Table columns configuration - match the UI in the screenshot
  const columns = [
    {
      title: '',
      dataIndex: 'dragIcon',
      width: 30,
      render: () => (
        <div className="drag-icon">
          <span className="drag-dots">⋮</span>
        </div>
      ),
    },
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
  ];

  // Define a custom table body component that supports sorting
  const SortableBody = props => {
    const { children, ...restProps } = props;
    
    return (
      <SortableContainer
        useDragHandle={false} // We'll use the whole row for drag but prevent text selection
        disableAutoscroll={false}
        helperClass="row-dragging"
        onSortEnd={onSortEnd}
        disabled={isFiltering}
        distance={5} // This value prevents accidental drags
        lockAxis="y"
        lockToContainerEdges={true}
        {...restProps}
      >
        {React.Children.toArray(children)}
      </SortableContainer>
    );
  };

  // Define the components to be used in the Table
  const components = {
    body: {
      wrapper: SortableBody,
      row: props => {
        const index = props['data-row-key'];
        return <SortableRow index={Number(index)} {...props} />;
      }
    }
  };

  return (
    <div className="employee-order-container">
      {contextHolder}
      
      <div className="employee-order-header">
        <div className="employee-header-title">
          <h1>Employee Order Management</h1>
          <Tooltip title="Click and drag rows to reorder employees">
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
              Save Order
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
            components={components}
            className="employee-short-table"
            bordered={false}
            size="middle"
            showHeader={true}
            scroll={{ y: false, x: 'max-content' }}
            rowKey={(_, index) => index.toString()}
            onRow={(_, index) => ({
              index,
              className: 'employee-row',
              style: { 
                cursor: isFiltering ? 'default' : 'grab',
                touchAction: 'none' // Prevents touch scrolling during dragging on touch devices
              }
            })}
          />
        </div>
        
        {isFiltering && (
          <div className="filtering-message">
            <InfoCircleOutlined /> Drag and drop is disabled while filtering. Clear the search to reorder employees.
          </div>
        )}
        
        {hasChanges && !isFiltering && (
          <div className="changes-message">
            <InfoCircleOutlined /> You have unsaved changes. Don't forget to save your order.
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeOrderPage;