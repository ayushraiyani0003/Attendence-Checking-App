import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Select, Space, Typography, Tag, Card, Divider, Tooltip, notification, Form, Modal, DatePicker, Switch } from 'antd';
import { SearchOutlined, DownloadOutlined, UserOutlined, EditOutlined, DeleteOutlined, PlusOutlined, FilterOutlined } from '@ant-design/icons';
import { useSettings } from '../../context/SettingsContext';
import useEmployee from '../../hooks/useEmployee';
import * as XLSX from 'xlsx';
import './EmployeePage.css';

const { Title } = Typography;
const { Option } = Select;

const EmployeePage = () => {
  const { departments = [], designations = [], reportingGroups = [], branches = [], sections = [], loading: settingsLoading } = useSettings();
  const { employees = [], loading, addEmployee, editEmployee, removeEmployee } = useEmployee();
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
    if (!employees || !employees.length) {
      setFilteredData([]);
      return;
    }

    const lowerSearchText = searchText.toLowerCase();
    const filtered = employees.filter(item => {
      // Convert punch_code to string to handle mixed types
      const punchCodeStr = String(item.punch_code || '');

      return (
        (item.name && item.name.toLowerCase().includes(lowerSearchText)) ||
        (item.department && item.department.toLowerCase().includes(lowerSearchText)) ||
        (item.designation && item.designation.toLowerCase().includes(lowerSearchText)) ||
        (item.reporting_group && item.reporting_group.toLowerCase().includes(lowerSearchText)) ||
        (item.branch && item.branch.toLowerCase().includes(lowerSearchText)) ||
        (item.sections && item.sections.toLowerCase().includes(lowerSearchText)) ||
        punchCodeStr.includes(lowerSearchText)
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
        'Reporting Group': employee.reporting_group,
        'Net Hours': employee.net_hr,
        'Week Off': employee.week_off,
        'Resign Date': employee.resign_date,
        'Status': employee.status,
        'Branch': employee.branch,
        'Sections': employee.sections
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
        const aVal = String(a.punch_code || '');
        const bVal = String(b.punch_code || '');
        return aVal.localeCompare(bVal);
      },
      render: (text) => <span className="employee-page-punch-code">{text}</span>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
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
      filters: departments && departments.length ? departments.map((dept) => ({ text: dept.name, value: dept.name })) : [],
      onFilter: (value, record) => record.department === value,
      render: (text) => <Tag>{text}</Tag>,
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      filters: designations && designations.length ? designations.map((desig) => ({ text: desig.designation_name, value: desig.designation_name })) : [],
      onFilter: (value, record) => record.designation === value,
      render: (text) => <span>{text}</span>,
    },
    {
      title: 'Net Hours',
      dataIndex: 'net_hr',
      key: 'net_hr',
      sorter: (a, b) => (a.net_hr || 0) - (b.net_hr || 0),
      render: (text) => <span>{text}</span>,
    },
    {
      title: 'Week Off',
      dataIndex: 'week_off',
      key: 'week_off',
      filters: [
        { text: 'Sunday', value: 'Sunday' },
        { text: 'Monday', value: 'Monday' },
        { text: 'Tuesday', value: 'Tuesday' },
        { text: 'Wednesday', value: 'Wednesday' },
        { text: 'Thursday', value: 'Thursday' },
        { text: 'Friday', value: 'Friday' },
        { text: 'Saturday', value: 'Saturday' },
      ],
      onFilter: (value, record) => record.week_off === value,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Branch',
      dataIndex: 'branch',
      key: 'branch',
      filters: branches && branches.length ? branches.map((branch) => ({ text: branch.name, value: branch.name })) : [],
      onFilter: (value, record) => record.branch === value,
      render: (text) => <span>{text}</span>,
    },
    {
      title: 'Sections',
      dataIndex: 'sections',
      key: 'sections',
      filters: sections && sections.length ? sections.map((section) => ({ text: section.name, value: section.name })) : [],
      onFilter: (value, record) => record.sections === value,
      render: (text) => <span>{text}</span>,
    },
    {
      title: 'Reporting Group',
      dataIndex: 'reporting_group',
      key: 'reporting_group',
      filters: reportingGroups && reportingGroups.length ? reportingGroups.map((group) => ({ text: group.groupname, value: group.groupname })) : [],
      onFilter: (value, record) => record.reporting_group === value,
      render: (text) => {
        
        return <Tag color={'default'}>{text}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'active', value: 'active' },
        { text: 'inactive', value: 'inactive' },
        { text: 'resigned', value: 'resigned' },
        { text: 'on_leave', value: 'on_leave' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const statusColors = {
          active: 'green',
          inactive: 'red',
          resigned: 'orange',
          on_leave: 'blue'
        };
        return <Tag color={statusColors[status] || 'default'}>{status || 'N/A'}</Tag>;
      },
    },
    {
      title: 'Resign Date',
      dataIndex: 'resign_date',
      key: 'resign_date',
      sorter: (a, b) => {
        if (!a.resign_date) return 1;
        if (!b.resign_date) return -1;
        return new Date(a.resign_date) - new Date(b.resign_date);
      },
      render: (text) => text ? <span>{text}</span> : <span>-</span>,
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
    form.setFieldsValue({
      ...employee,
      resign_date: employee.resign_date ? employee.resign_date : null
    });
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
                placeholder="Search by name, department, designation, reporting group, branch, section or punch code..."
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
                  <Table.Summary.Cell index={0} colSpan={12} className="table-summary">
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
              {departments && departments.map((dept) => (
                <Option key={dept.id} value={dept.name}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Designation" name="designation" rules={[{ required: true, message: 'Please select the designation!' }]}>
            <Select placeholder="Select designation">
              {designations && designations.map((desig) => (
                <Option key={desig.id} value={desig.designation_name}>
                  {desig.designation_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Reporting Group" name="reporting_group" rules={[{ required: true, message: 'Please select the reporting group!' }]}>
            <Select placeholder="Select reporting group">
              {reportingGroups && reportingGroups.map((group) => (
                <Option key={group.id} value={group.groupname}>
                  {group.groupname}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          {/* New form fields for the additional columns */}
          <Form.Item label="Net Hours" name="net_hr" rules={[{ required: true, message: 'Please enter net hours!' }]}>
            <Input type="number" placeholder="Enter net hours" />
          </Form.Item>

          <Form.Item label="Week Off" name="week_off" rules={[{ required: true, message: 'Please select week off day!' }]}>
            <Select placeholder="Select week off day">
              <Option value="Sunday">Sunday</Option>
              <Option value="Monday">Monday</Option>
              <Option value="Tuesday">Tuesday</Option>
              <Option value="Wednesday">Wednesday</Option>
              <Option value="Thursday">Thursday</Option>
              <Option value="Friday">Friday</Option>
              <Option value="Saturday">Saturday</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Branch" name="branch" rules={[{ required: true, message: 'Please select branch!' }]}>
            <Select placeholder="Select branch">
              {branches && branches.map((branch) => (
                <Option key={branch.id} value={branch.name}>
                  {branch.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Sections" name="sections" rules={[{ required: true, message: 'Please select section!' }]}>
            <Select placeholder="Select section">
              {sections && sections.map((section) => (
                <Option key={section.id} value={section.name}>
                  {section.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Status" name="status">
            <Select placeholder="Select status">
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="resigned">Resigned</Option>
              <Option value="on_leave">On Leave</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Resign Date" name="resign_date">
            <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
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
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default EmployeePage;