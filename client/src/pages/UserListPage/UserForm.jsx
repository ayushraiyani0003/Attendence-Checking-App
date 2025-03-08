import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, MenuItem } from '@mui/material';
import { useStaticData } from '../../hooks/userList';  // Import the useStaticData hook

function UserForm({ open, onClose, mode, userData, onSubmit }) {
  const { departments, designations, reportingGroups, loading, error } = useStaticData();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    phoneNo: '',
    department: '',
    designation: '',
    userRole: '',
    reportingGroup: [],
  });

  useEffect(() => {
    if (mode === 'edit' && userData) {
      // check if user_role = admin then Admin else User
      const userRole = userData.user_role === 'admin' ? 'Admin' : 'User';
      setFormData({
        username: userData.username,
        name: userData.name,
        password: "",
        phoneNo: userData.phone_no,
        department: userData.department,
        designation: userData.designation,  // Ensure it is an array for multiple selections
        userRole: userRole,
        reportingGroup: userData.reporting_group || []  // Ensure it is an array for multiple selections
      });
    }
    else{
      setFormData({
        username: "",
        name: "",
        password: "",
        phoneNo: "",
        department: "",
        designation: "",  // Ensure it is an array for multiple selections
        userRole: "",
        reportingGroup: []  // Ensure it is an array for multiple selections
      });
    }
  }, [mode, userData]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // If it's a multi-select, update the array (this applies to reportingGroup and designation)
    if (type === 'select-multiple') {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    } else {
        // For single select fields like department or userRole
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Call the onSubmit function passed as a prop (which will either add or update)
    onSubmit(formData);
    onClose();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const userRoles = ['Admin', 'User'];

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
              name="password"
              label="Password"
              value={formData.password}
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
                <MenuItem key={dept.id} value={dept.name}>
                  {dept.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="designation"
              label="Designation"
              value={formData.designation}
              onChange={handleChange}
              select
              fullWidth
              required
            >
              {designations.map((designation) => (
                <MenuItem key={designation.id} value={designation.designation_name}>
                  {designation.designation_name}
                </MenuItem>
              ))}
            </TextField>
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
              name="reportingGroup"
              label="Reporting Group"
              value={formData.reportingGroup}
              onChange={handleChange}
              select
              fullWidth
              required
              SelectProps={{
                multiple: true
              }}
            >
              {reportingGroups.map((group) => (
                <MenuItem key={group.id} value={group.groupname}>
                  {group.groupname}
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
  );
}

export default UserForm;
