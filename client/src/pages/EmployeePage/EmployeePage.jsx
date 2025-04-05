import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Select, Space, Typography, Tag, Card, Divider, Tooltip, notification, Form, Modal } from 'antd';
import { SearchOutlined, DownloadOutlined, UserOutlined, EditOutlined, DeleteOutlined, PlusOutlined, FilterOutlined } from '@ant-design/icons';
import { useSettings } from '../../context/SettingsContext';
import useEmployee from '../../hooks/useEmployee';
import * as XLSX from 'xlsx';
import './EmployeePage.css';

const { Title } = Typography;
const { Option } = Select;

const EmployeePage = () => {
  const { departments, designations, reportingGroups, loading: settingsLoading } = useSettings();
  const { employees, loading, addEmployee, editEmployee, removeEmployee } = useEmployee();
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [pageSize, setPageSize] = useState(12);
  // Add state for delete confirmation modal
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const [form] = Form.useForm();

  // Improved search functionality to handle mixed types
  useEffect(() => {
    if (!employees.length) return;

    const lowerSearchText = searchText.toLowerCase();
    const filtered = employees.filter(item => {
      // Convert punch_code to string to handle mixed types
      const punchCodeStr = String(item.punch_code);

      return (
        (item.name && item.name.toLowerCase().includes(lowerSearchText)) ||
        (item.department && item.department.toLowerCase().includes(lowerSearchText)) ||
        (item.designation && item.designation.toLowerCase().includes(lowerSearchText)) ||
        (item.reporting_group && item.reporting_group.toLowerCase().includes(lowerSearchText)) ||
        (punchCodeStr && punchCodeStr.includes(lowerSearchText))
      );
    });

    setFilteredData(filtered);
  }, [employees, searchText]);

  // Function to show delete confirmation modal
  const showDeleteConfirm = (employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteModalVisible(true);
  };

  // Function to handle confirmed deletion
  const handleDeleteConfirm = () => {
    if (employeeToDelete) {
      removeEmployee(employeeToDelete.employee_id);
      setIsDeleteModalVisible(false);
      setEmployeeToDelete(null);
    }
  };

  // Function to cancel deletion
  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false);
    setEmployeeToDelete(null);
  };

  // Function to export employee data to Excel
  const exportToExcel = () => {
    try {
      // Determine which data to export (filtered or all)
      const dataToExport = filteredData.length > 0 ? filteredData : employees;
      
      // Create a new array with only the data we want to export
      const exportData = dataToExport.map(employee => ({
        'Punch Code': employee.punch_code,
        'Name': employee.name,
        'Department': employee.department,
        'Designation': employee.designation,
        'Reporting Group': employee.reporting_group
      }));
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Convert the data to a worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Save the file
      saveAsExcelFile(excelBuffer, 'Employee_Directory');
      
      // Show success notification
      notification.success({
        message: 'Export Successful',
        description: `Successfully exported ${exportData.length} employee records.`,
        placement: 'bottomRight',
      });
    } catch (error) {
      // Show error notification
      notification.error({
        message: 'Export Failed',
        description: 'There was an error exporting the data. Please try again.',
        placement: 'bottomRight',
      });
      console.error("Export error:", error);
    }
  };

  // Helper function to save the Excel file
  const saveAsExcelFile = (buffer, fileName) => {
    const data = new Blob([buffer], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    link.download = `${fileName}_${formattedDate}.xlsx`;
    link.click();
    // Clean up
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      link.remove();
    }, 100);
  };

  const columns = [
    {
      title: 'Punch Code',
      dataIndex: 'punch_code',
      key: 'punch_code',
      sorter: (a, b) => {
        // Handle mixed type sorting
        const aVal = String(a.punch_code);
        const bVal = String(b.punch_code);
        return aVal.localeCompare(bVal);
      },
      render: (text) => <span className="employee-page-punch-code">{text}</span>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => (
        <Space className="employee-name" size={4}>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      filters: departments.map((dept) => ({ text: dept.name, value: dept.name })),
      onFilter: (value, record) => record.department === value,
      render: (text) => <Tag>{text}</Tag>,
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      filters: designations.map((desig) => ({ text: desig.designation_name, value: desig.designation_name })),
      onFilter: (value, record) => record.designation === value,
      render: (text) => <span>{text}</span>,
    },
    {
      title: 'Reporting Group',
      dataIndex: 'reporting_group',
      key: 'reporting_group',
      filters: reportingGroups.map((group) => ({ text: group.groupname, value: group.groupname })),
      onFilter: (value, record) => record.reporting_group === value,
      render: (text) => {
        const shiftColors = {
          Morning: 'green',
          Afternoon: 'blue',
          Night: 'purple',
        };
        return <Tag color={shiftColors[text]}>{text}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Edit employee">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditEmployee(record)}
            >
              Edit
            </Button>
          </Tooltip>
          <Tooltip title="Delete employee">
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => showDeleteConfirm(record)}
            >
              Delete
            </Button>
          </Tooltip>
        </Space>

      ),
      fixed: 'right',
    },
  ];

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleAddEmployee = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedEmployee(null);
    form.resetFields();
  };

  const handleSubmit = (values) => {
    if (selectedEmployee) {
      editEmployee(selectedEmployee.employee_id, values);
    } else {
      addEmployee(values);
    }

    setIsModalVisible(false);
    setSelectedEmployee(null);
    form.resetFields();
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    form.setFieldsValue(employee);
    setIsModalVisible(true);
  };

  const handlePageSizeChange = (current, size) => {
    setPageSize(size);
  };

  return (
    <div className="employee-page">
      <Card className="employee-card">
        <div className="page-header">
          <div className="title-section">
            <Title level={2} className="page-title">
              <UserOutlined className="title-icon" />
              Employee Directory
            </Title>
            <p className="page-subtitle">Manage your company's employee information</p>
          </div>

          <Divider className="header-divider" />

          <div className="actions-container">
            <div className="search-section">
              <Input
                placeholder="Search by name, department, designation, reporting group, or punch code..."
                prefix={<SearchOutlined className="search-icon" />}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input"
                allowClear
              />
              <Button icon={<FilterOutlined />} className="filter-button">
                Filters
              </Button>
            </div>

            <div className="button-section">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="add-button"
                onClick={handleAddEmployee}
              >
                Add Employee
              </Button>
              <Button 
                type="default" 
                icon={<DownloadOutlined />} 
                className="export-button"
                onClick={exportToExcel}
              >
                Export
              </Button>
            </div>
          </div>
        </div>

        <div className="table-container">
          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading || settingsLoading}
            pagination={{
              total: filteredData.length,
              pageSize: pageSize,
              showSizeChanger: true,
              pageSizeOptions: ['12', '25', '55', '100'],
              showTotal: (total) => `Total: ${total} employees`,
              onChange: (page, pageSize) => { },
              onShowSizeChange: handlePageSizeChange,
              className: 'custom-pagination',
              size: 'small',
            }}
            rowKey="employee_id"
            bordered
            scroll={{ x: 'max-content', y: 'calc(78vh - 230px)' }}
            className="employee-table"
            size="small"
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={6} className="table-summary">
                    {loading ? 'Loading data...' : `Showing ${filteredData.length} of ${employees.length} employees`}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </div>
      </Card>

      {/* Employee Add/Edit Modal */}
      <Modal
        title={selectedEmployee ? "Edit Employee" : "Add Employee"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Punch Code" name="punch_code" rules={[{ required: true, message: 'Please enter the punch code!' }]}>
            <Input placeholder="Enter employee's punch code" />
          </Form.Item>

          <Form.Item label="Department" name="department" rules={[{ required: true, message: 'Please select the department!' }]}>
            <Select placeholder="Select department">
              {departments.map((dept) => (
                <Option key={dept.id} value={dept.name}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Designation" name="designation" rules={[{ required: true, message: 'Please select the designation!' }]}>
            <Select placeholder="Select designation">
              {designations.map((desig) => (
                <Option key={desig.id} value={desig.designation_name}>
                  {desig.designation_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Reporting Group" name="reporting_group" rules={[{ required: true, message: 'Please select the reporting group!' }]}>
            <Select placeholder="Select reporting group">
              {reportingGroups.map((group) => (
                <Option key={group.id} value={group.groupname}>
                  {group.groupname}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={handleCancel} type="default">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        open={isDeleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="Yes"
        cancelText="No"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete employee <strong>{employeeToDelete?.name}</strong>?</p>
        <p>This action cannot be undo.</p>
      </Modal>
    </div>
  );
};

export default EmployeePage;