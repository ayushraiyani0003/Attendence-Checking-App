import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Select, Space, Typography, Tag, Card, Divider, Tooltip, notification, Form, Modal } from 'antd';
import { SearchOutlined, DownloadOutlined, UserOutlined, EditOutlined, DeleteOutlined, PlusOutlined, FilterOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import './EmployeePage.css';

const { Title } = Typography;
const { Option } = Select;

const EmployeePage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  const columns = [
    {
      title: 'Punch Code',
      dataIndex: 'punchCode',
      key: 'punchCode',
      sorter: (a, b) => a.punchCode - b.punchCode,
      render: (text) => <span className="employee-page-punch-code">{text}</span>,
      width: 10,
      
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
      width: 350,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      filters: [
        { text: 'Marketing', value: 'Marketing' },
        { text: 'Engineering', value: 'Engineering' },
        { text: 'Finance', value: 'Finance' },
      ],
      onFilter: (value, record) => record.department === value,
      render: (text) => <Tag className="department-tag">{text}</Tag>,
      width: 300,
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      filters: [
        { text: 'Specialist', value: 'Specialist' },
        { text: 'Engineer', value: 'Engineer' },
        { text: 'Analyst', value: 'Analyst' },
      ],
      onFilter: (value, record) => record.designation.includes(value),
      render: (text) => <span className="employee-page-designation">{text}</span>,
      width: 200,
    },
    {
      title: 'Reporting Group',
      dataIndex: 'reportingGroup',
      key: 'reportingGroup',
      filters: [
        { text: 'Morning', value: 'Morning' },
        { text: 'Afternoon', value: 'Afternoon' },
        { text: 'Night', value: 'Night' },
      ],
      onFilter: (value, record) => record.reportingGroup === value,
      render: (text) => {
        const shiftColors = {
          'Morning': 'green',
          'Afternoon': 'blue',
          'Night': 'purple'
        };
        return <Tag color={shiftColors[text]} className="shift-tag">{text}</Tag>;
      },
      width: 200,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space className="employee-action-buttons" size={4}>
          <Tooltip title="Edit employee">
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              size="small"
              className="edit-button"
            >
              Edit
            </Button>
          </Tooltip>
          <Tooltip title="Delete employee">
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              className="delete-button"
            >
              Delete
            </Button>
          </Tooltip>
        </Space>
      ),
      width: 200,
      fixed: 'right',
    },
  ];

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockData = [
      {
        key: '1',
        punchCode: '1001',
        name: 'John Smith',
        department: 'Marketing',
        designation: 'Marketing Specialist',
        reportingGroup: 'Morning',
      },
      {
        key: '2',
        punchCode: '1002',
        name: 'Jane Doe',
        department: 'Engineering',
        designation: 'Software Engineer',
        reportingGroup: 'Afternoon',
      },
      {
        key: '3',
        punchCode: '1003',
        name: 'Mike Johnson',
        department: 'Finance',
        designation: 'Financial Analyst',
        reportingGroup: 'Night',
      },
      {
        key: '4',
        punchCode: '1004',
        name: 'Sara Williams',
        department: 'Engineering',
        designation: 'DevOps Engineer',
        reportingGroup: 'Morning',
      },
      {
        key: '5',
        punchCode: '1005',
        name: 'Robert Chen',
        department: 'Marketing',
        designation: 'Digital Marketing Specialist',
        reportingGroup: 'Afternoon',
      },
    ];
    setTimeout(() => {
      setEmployees(mockData);
      setFilteredData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
    const filtered = employees.filter(
      (item) =>
        item.name.toLowerCase().includes(value.toLowerCase()) ||
        item.department.toLowerCase().includes(value.toLowerCase()) ||
        item.designation.toLowerCase().includes(value.toLowerCase()) ||
        item.punchCode.includes(value)
    );
    setFilteredData(filtered);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'employees.xlsx');
  };
  
  const handleAddEmployee = () => {
    setIsModalVisible(true); // Show the modal when the "+" button is clicked
  };

  const handleCancel = () => {
    setIsModalVisible(false); // Close the modal
  };

  const handleSubmit = (values) => {
    console.log('Employee Data:', values);
    // You can handle adding the employee to the state or send it to an API here
    notification.success({
      message: 'Employee Added Successfully',
      description: `Employee ${values.name} has been added.`,
    });

    setIsModalVisible(false); // Close the modal after form submission
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
              <Button
                icon={<FilterOutlined />}
                className="filter-button"
              >
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
                onClick={handleExport}
                className="export-button"
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
            loading={loading}
            pagination={{
              total: filteredData.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} employees`,
              className: "custom-pagination",
              size: "small"
            }}
            rowKey="punchCode"
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
        title="Add Employee"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null} // Remove default footer buttons
        width={600}
      >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

          <Form.Item
            label="Punch Code"
            name="punchCode"
            rules={[{ required: true, message: 'Please enter the punch code!' }]}
          >
            <Input placeholder="Enter employee's punch code" />
          </Form.Item>

          <Form.Item
            label="Department"
            name="department"
            rules={[{ required: true, message: 'Please select the department!' }]}
          >
            <Select placeholder="Select department">
              <Option value="Marketing">Marketing</Option>
              <Option value="Engineering">Engineering</Option>
              <Option value="Finance">Finance</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Designation"
            name="designation"
            rules={[{ required: true, message: 'Please select the designation!' }]}
          >
            <Select placeholder="Select designation">
              <Option value="Specialist">Specialist</Option>
              <Option value="Engineer">Engineer</Option>
              <Option value="Analyst">Analyst</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Reporting Group"
            name="reportingGroup"
            rules={[{ required: true, message: 'Please select the reporting group!' }]}
          >
            <Select placeholder="Select reporting group">
              <Option value="Morning">Morning</Option>
              <Option value="Afternoon">Afternoon</Option>
              <Option value="Night">Night</Option>
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