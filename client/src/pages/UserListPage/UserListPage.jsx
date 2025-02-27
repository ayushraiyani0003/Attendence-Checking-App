import React, { useState } from 'react'
import UserTable from './UserTable'
import UserForm from './UserForm'
import { Box, Button, Container, Typography, Paper } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import './UserListPage.css';

function UserListPage() {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const users = [
    { 
      id: 1,
      username: 'johndoe',
      name: 'John Doe',
      phoneNo: '+1234567890',
      department: 'Engineering',
      designation: 'Senior Engineer',
      userRole: 'Admin',
      assignedDepartments: ['Engineering', 'QA'],
      lastLogin: '2023-10-20T09:30:00Z',
      isOnline: true
    },
    {
      id: 2, 
      username: 'janesmith',
      name: 'Jane Smith',
      phoneNo: '+0987654321',
      department: 'HR',
      designation: 'HR Manager',
      userRole: 'User',
      assignedDepartments: ['HR'],
      lastLogin: '2023-10-19T16:45:00Z',
      isOnline: false
    }
  ]

  const handleEdit = (user) => {
    setSelectedUser(user)
    setIsEditUserOpen(true)
  }

  return (
    <div maxWidth="xl" className="user-list-page">
      <Box sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              User Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsAddUserOpen(true)}
              sx={{
                backgroundColor: '#1976d2',
                '&:hover': { backgroundColor: '#1565c0' }
              }}
            >
              Add New User
            </Button>
          </Box>

          <UserTable 
            onEdit={handleEdit}
            onDelete={(userId) => {
              // Handle delete
            }}
            users={users}
          />
        </Paper>
      </Box>

      {/* Add User Modal */}
      <UserForm 
        open={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        mode="add"
      />

      {/* Edit User Modal */}
      <UserForm
        open={isEditUserOpen}
        onClose={() => {
          setIsEditUserOpen(false)
          setSelectedUser(null)
        }}
        mode="edit"
        userData={selectedUser}
      />
    </div>
  )
}

export default UserListPage
