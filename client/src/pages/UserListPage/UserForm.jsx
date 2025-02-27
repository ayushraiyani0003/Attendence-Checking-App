import React, { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, MenuItem } from '@mui/material'

function UserForm({ open, onClose, mode, userData }) {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    phoneNo: '',
    department: '',
    designation: '',
    userRole: '',
    assignedDepartments: []
  })

  useEffect(() => {
    if (mode === 'edit' && userData) {
      setFormData({
        username: userData.username,
        name: userData.name,
        phoneNo: userData.phoneNo,
        department: userData.department,
        designation: userData.designation,
        userRole: userData.userRole,
        assignedDepartments: userData.assignedDepartments
      })
    }
  }, [mode, userData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission here
    // You can make API call to save/update user
    onClose()
  }

  const userRoles = ['Admin', 'User']
  const departments = ['HR', 'IT', 'Finance', 'Operations']

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'add' ? 'Add New User' : 'Edit User'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="username"
              label="Username"
              value={formData.username}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              name="name"
              label="Full Name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              name="phoneNo"
              label="Phone Number"
              value={formData.phoneNo}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              name="department"
              label="Department"
              value={formData.department}
              onChange={handleChange}
              select
              fullWidth
              required
            >
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="designation"
              label="Designation"
              value={formData.designation}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              name="userRole"
              label="User Role"
              value={formData.userRole}
              onChange={handleChange}
              select
              fullWidth
              required
            >
              {userRoles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="assignedDepartments"
              label="Assigned Departments"
              value={formData.assignedDepartments}
              onChange={handleChange}
              select
              fullWidth
              required
              SelectProps={{
                multiple: true
              }}
            >
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {mode === 'add' ? 'Add User' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default UserForm