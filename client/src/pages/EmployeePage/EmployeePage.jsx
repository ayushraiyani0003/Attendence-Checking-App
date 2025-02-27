import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Select, Space, Typography, Tag, Card } from 'antd';
import { SearchOutlined, DownloadOutlined, UserOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

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
      width: '10%',
      sorter: (a, b) => a.punchCode - b.punchCode,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
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
      render: (text) => <Tag color="blue">{text}</Tag>,
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
      render: (text) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            style={{
              backgroundColor: '#90caf9',
              borderColor: '#90caf9',
              color: '#000',
              fontWeight: 500,
              padding: '2px 12px',
              height: '32px',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Edit
          </Button>
          <Button 
            type="danger" 
            icon={<DeleteOutlined />} 
            size="small"
            style={{
              backgroundColor: '#ffcdd2',
              borderColor: '#ffcdd2', 
              color: '#c62828',
              fontWeight: 500,
              padding: '2px 12px',
              height: '32px',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockData = [
      {
        punchCode: '1001',
        name: 'John Smith',
        department: 'Marketing',
        designation: 'Marketing Specialist',
        defaultShift: 'Morning',
      },
      {
        punchCode: '1002',
        name: 'Jane Doe',
        department: 'Engineering',
        designation: 'Software Engineer',
        defaultShift: 'Afternoon',
      },
      {
        punchCode: '1003',
        name: 'Mike Johnson',
        department: 'Finance',
        designation: 'Financial Analyst',
        defaultShift: 'Morning',
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
    <div className="employee-page" style={{ padding: '24px' }}>
      <Card className="employee-card" style={{ borderRadius: '2px' }}>
        <div className="page-header" style={{ marginBottom: '24px' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Title level={2}>
              <UserOutlined style={{ marginRight: '8px' }} />
              Employee List
            </Title>
            <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Input
                placeholder="Search by punch code, name, department..."
                prefix={<SearchOutlined />}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                Export to Excel
              </Button>
            </Space>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{
            total: filteredData.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} employees`,
          }}
          rowKey="punchCode"
          bordered
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
};

export default EmployeePage;
