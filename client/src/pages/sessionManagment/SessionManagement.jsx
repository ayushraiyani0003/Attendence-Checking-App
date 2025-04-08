// pages/admin/SessionManagement.js
import React, { useState, useRef, useEffect } from 'react';
import { useUsers } from "../../hooks/userList";
import { useSessionManagement } from '../../hooks/useSessions';
import { FiTrash2, FiUsers, FiClock, FiAlertTriangle, FiX, FiUser, FiSearch, FiLogOut } from 'react-icons/fi';
import { Table, Input, Button, Modal, Checkbox, Space, Tag, Avatar, Typography } from 'antd';
import './SessionManagement.css';

const { Text, Title } = Typography;
const { Search } = Input;

const SessionManagement = () => {
  const { users } = useUsers();
  const { 
    isLoading, 
    selectedUsers, 
    toggleUserSelection, 
    clearSelections,
    deleteAllSessions, 
    deleteUserSessions, 
    deleteInactiveSessions, 
    deleteOldSessions,
    deleteMultipleUserSessions
  } = useSessionManagement();
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('userSessions');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Helper to open confirmation modal
  const confirmAction = (type, id = null) => {
    setActionType(type);
    setUserId(id);
    setShowConfirmModal(true);
  };

  // Execute action based on type
  const executeAction = async () => {
    try {
      switch (actionType) {
        case 'all':
          await deleteAllSessions();
          break;
        case 'user':
          await deleteUserSessions(userId);
          break;
        case 'inactive':
          await deleteInactiveSessions();
          break;
        case 'old':
          await deleteOldSessions();
          break;
        case 'multiple':
          await deleteMultipleUserSessions();
          break;
        default:
          break;
      }
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error executing action:', error);
    }
  };
  
  const getConfirmationMessage = () => {
    switch (actionType) {
      case 'all':
        return 'Are you sure you want to delete ALL sessions? This will log out all users.';
      case 'user':
        const user = users.find(u => u.id === userId);
        return `Are you sure you want to delete all sessions for ${user?.name || 'this user'}?`;
      case 'inactive':
        return 'Are you sure you want to delete all inactive sessions?';
      case 'old':
        return 'Are you sure you want to delete all sessions older than one week?';
      case 'multiple':
        return `Are you sure you want to delete sessions for ${selectedUsers.length} selected users?`;
      default:
        return '';
    }
  };
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(lowerSearchTerm) || 
      (user.department && user.department.toLowerCase().includes(lowerSearchTerm)) ||
      (user.id.toString().toLowerCase().includes(lowerSearchTerm))
    );
  });

  // Handle row selection
  const rowSelection = {
    selectedRowKeys: selectedUsers,
    onChange: (selectedRowKeys) => {
      // Clear existing selections
      clearSelections();
      
      // Add all new selections
      selectedRowKeys.forEach(key => {
        toggleUserSelection(key);
      });
    },
  };

  // Define table columns
  const columns = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }}>
            {text.charAt(0).toUpperCase()}
          </Avatar>
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Email/Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: id => <Text code>{id}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          danger
          type="outline"
          icon={<FiLogOut />}
          onClick={() => confirmAction('user', record.id)}
        >
          Logout User
        </Button>
      ),
    },
  ];

  return (
    <div className="app-container">
      <div className="session-management">
        <header className="page-header">
          <div className="header-content">
            <div className="header-title">
              <Title level={2}>Session Management</Title>
              <Text type="secondary">Manage user sessions and authentication</Text>
            </div>
            
            <div className="header-actions">
              {selectedUsers.length > 0 && (
                <Button 
                  danger
                  icon={<FiTrash2 />}
                  onClick={() => confirmAction('multiple')}
                >
                  Delete Selected ({selectedUsers.length})
                </Button>
              )}
              <Space>
                <Button 
                  type={activeTab === 'userSessions' ? 'primary' : 'default'}
                  icon={<FiUsers />}
                  onClick={() => setActiveTab('userSessions')}
                >
                  User Sessions
                </Button>
                <Button 
                  type={activeTab === 'bulkActions' ? 'primary' : 'default'}
                  icon={<FiClock />}
                  onClick={() => setActiveTab('bulkActions')}
                >
                  Bulk Actions
                </Button>
              </Space>
            </div>
          </div>
        </header>

        <main className="page-content">
          {activeTab === 'userSessions' && (
            <div className="user-sessions-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Title level={4}>User Sessions</Title>
                  {selectedUsers.length > 0 && (
                    <Tag color="blue">{selectedUsers.length} selected</Tag>
                  )}
                </div>
                
                <div className="panel-actions">
                  <Space>
                    <Search
                      placeholder="Search by name, department or ID"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: 300 }}
                    />
                    
                    {selectedUsers.length > 0 && (
                      <Button 
                        icon={<FiX />}
                        onClick={clearSelections}
                      >
                        Clear Selection
                      </Button>
                    )}
                  </Space>
                </div>
              </div>
              
              <div className="panel-body">
                <Table
                  rowSelection={rowSelection}
                  columns={columns}
                  dataSource={filteredUsers.map(user => ({ ...user, key: user.id }))}
                  loading={isLoading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 800, y: 550 }} // Enables horizontal and vertical scrolling
                  size="middle"
                  locale={{
                    emptyText: (
                      <div className="empty-state">
                        <FiUser className="empty-icon" />
                        <h3>No users found</h3>
                        <p>
                          {searchTerm ? 'Try adjusting your search' : 'There are no users in the system'}
                        </p>
                      </div>
                    )
                  }}
                />
              </div>
            </div>
          )}
          
          {activeTab === 'bulkActions' && (
            <section className="bulk-actions-grid">
              <div className="action-card danger-card">
                <div className="card-accent"></div>
                <div className="card-icon danger-icon">
                  <FiAlertTriangle />
                </div>
                <h3>Delete All Sessions</h3>
                <p>This will log out all users from all devices and terminate all active sessions.</p>
                <Button 
                  danger
                  type="primary"
                  block
                  icon={<FiTrash2 />}
                  onClick={() => confirmAction('all')}
                  loading={isLoading}
                >
                  Delete All Sessions
                </Button>
              </div>
              
              <div className="action-card warning-card">
                <div className="card-accent"></div>
                <div className="card-icon warning-icon">
                  <FiClock />
                </div>
                <h3>Delete Inactive Sessions</h3>
                <p>Delete sessions that are marked inactive or haven't been active for 24 hours.</p>
                <Button 
                  type="primary" 
                  danger
                  block
                  icon={<FiTrash2 />}
                  onClick={() => confirmAction('inactive')}
                  loading={isLoading}
                >
                  Delete Inactive Sessions
                </Button>
              </div>
              
              <div className="action-card info-card">
                <div className="card-accent"></div>
                <div className="card-icon info-icon">
                  <FiClock />
                </div>
                <h3>Delete Old Sessions</h3>
                <p>Delete all sessions that are older than one week regardless of activity status.</p>
                <Button 
                  type="primary"
                  block
                  icon={<FiTrash2 />}
                  onClick={() => confirmAction('old')}
                  loading={isLoading}
                >
                  Delete Old Sessions
                </Button>
              </div>
            </section>
          )}
        </main>
      </div>
      
      {/* Ant Design Confirmation Modal */}
      <Modal
        title={
          <Space>
            <FiAlertTriangle style={{ color: '#ff4d4f' }} />
            <span>Confirm Action</span>
          </Space>
        }
        open={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>,
          <Button 
            key="confirm" 
            danger 
            type="primary"
            onClick={executeAction}
            loading={isLoading}
          >
            Confirm Delete
          </Button>
        ]}
      >
        <p>{getConfirmationMessage()}</p>
      </Modal>
    </div>
  );
};

export default SessionManagement;