import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Select, Space, Typography, Tag, Card, Divider, Tooltip } from 'antd';
import { SearchOutlined, DownloadOutlined, UserOutlined, EditOutlined, DeleteOutlined, PlusOutlined, FilterOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import './EmployeePage.css';

const { Title } = Typography;

const EmployeePage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  
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
      title: 'Default Shift',
      dataIndex: 'defaultShift',
      key: 'defaultShift',
      filters: [
        { text: 'Morning', value: 'Morning' },
        { text: 'Afternoon', value: 'Afternoon' },
        { text: 'Night', value: 'Night' },
      ],
      onFilter: (value, record) => record.defaultShift === value,
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
              type="danger" 
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
        defaultShift: 'Morning',
      },
      {
        key: '2',
        punchCode: '1002',
        name: 'Jane Doe',
        department: 'Engineering',
        designation: 'Software Engineer',
        defaultShift: 'Afternoon',
      },
      {
        key: '3',
        punchCode: '1003',
        name: 'Mike Johnson',
        department: 'Finance',
        designation: 'Financial Analyst',
        defaultShift: 'Morning',
      },
      {
        key: '4',
        punchCode: '1004',
        name: 'Sara Williams',
        department: 'Engineering',
        designation: 'DevOps Engineer',
        defaultShift: 'Night',
      },
      {
        key: '5',
        punchCode: '1005',
        name: 'Robert Chen',
        department: 'Marketing',
        designation: 'Digital Marketing Specialist',
        defaultShift: 'Afternoon',
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
    </div>
  );
};

export default EmployeePage;