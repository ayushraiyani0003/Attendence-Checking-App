import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Select, Space, Typography, Tag, Card, Divider, Tooltip, notification, Form, Modal } from 'antd';
import { SearchOutlined, DownloadOutlined, UserOutlined, EditOutlined, DeleteOutlined, PlusOutlined, FilterOutlined } from '@ant-design/icons';
import { useSettings } from '../../context/SettingsContext'; // Import useSettings hook
import useEmployee from '../../hooks/useEmployee'; // Import employee hook
import './EmployeePage.css';

const { Title } = Typography;
const { Option } = Select;

const EmployeePage = () => {
  // Fetch departments, designations, and reporting groups from the useSettings hook
  const { departments, designations, reportingGroups, loading: settingsLoading } = useSettings();
  const { employees, loading, addEmployee, editEmployee, removeEmployee } = useEmployee();
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [form] = Form.useForm();

  // UseEffect to update filtered data when employees or searchText changes
  useEffect(() => {
    const filtered = employees.filter(
      (item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.department.toLowerCase().includes(searchText.toLowerCase()) ||
        item.designation.toLowerCase().includes(searchText.toLowerCase()) ||
        item.punchCode.includes(searchText)
    );
    setFilteredData(filtered);
  }, [employees, searchText]);

  console.log("employees", employees);

  const columns = [
    {
      title: 'Punch Code',
      dataIndex: 'punch_code',
      key: 'punch_code',
      sorter: (a, b) => a.punchCode - b.punchCode,
      render: (text) => <span className="employee-page-punch-code">{text}</span>,
      width: 100,
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
      width: 200,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      filters: departments.map((dept) => ({ text: dept.name, value: dept.id })), // Use dept.name and dept.id
      onFilter: (value, record) => record.department === value,
      render: (text) => <Tag>{text}</Tag>,
      width: 150,
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      filters: designations.map((desig) => ({ text: desig.designation_name, value: desig.designation_name })), // Use desig.name and desig.id
      onFilter: (value, record) => record.designation === value,
      render: (text) => <span>{text}</span>,
      width: 150,
    },
    {
      title: 'Reporting Group',
      dataIndex: 'reporting_group',
      key: 'reporting_group',
      filters: reportingGroups.map((group) => ({ text: group.groupname, value: group.groupname })), // Use group.name and group.id
      onFilter: (value, record) => record.reportingGroup === value,
      render: (text) => {
        const shiftColors = {
          Morning: 'green',
          Afternoon: 'blue',
          Night: 'purple',
        };
        return <Tag color={shiftColors[text]}>{text}</Tag>;
      },
      width: 180,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size={4}>
           <Tooltip title="Edit employee">
        <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => handleEditEmployee(record)} />
      </Tooltip>
          <Tooltip title="Delete employee">
            <Button danger icon={<DeleteOutlined />} size="small" onClick={() => removeEmployee(record.employee_id)} />
          </Tooltip>
        </Space>
      ),
      width: 180,
      fixed: 'right',
    },
  ];

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleAddEmployee = () => {
    setIsModalVisible(true); // Show the modal when the "+" button is clicked
  };

const handleCancel = () => {
  setIsModalVisible(false);
  setSelectedEmployee(null); // Reset selected employee
  form.resetFields(); // Clear form fields
};


const handleSubmit = (values) => {
  if (selectedEmployee) {
    // If editing, update the employee
    editEmployee(selectedEmployee.employee_id, values);
  } else {
    // If adding, create a new employee
    addEmployee(values);
  }

  setIsModalVisible(false); // Close modal
  setSelectedEmployee(null); // Reset selected employee
  form.resetFields(); // Clear the form
};


const handleEditEmployee = (employee) => {
  setSelectedEmployee(employee); // Store selected employee details
  form.setFieldsValue(employee); // Pre-fill the form
  setIsModalVisible(true); // Open modal
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
                placeholder="Search employees..."
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
              <Button type="default" icon={<DownloadOutlined />} className="export-button">
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
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} employees`,
              className: 'custom-pagination',
              size: 'small',
            }}
            rowKey="punch_code"
            bordered
            scroll={{ x: 'max-content' }}
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

      {/* Modal for adding employee */}
      <Modal
        title={selectedEmployee ? "Edit Employee" : "Add Employee"} // Change title dynamically
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null} // Remove default footer buttons
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
    </div>
  );
};

export default EmployeePage;
