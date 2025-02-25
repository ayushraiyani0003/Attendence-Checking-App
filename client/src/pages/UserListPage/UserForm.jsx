// UserForm.js
import React, { useState, useEffect } from 'react';
import { TextField } from '@mui/material';

const UserForm = ({ onSubmit, user }) => {
  const [userData, setUserData] = useState({
    username: '', name: '', phone: '', department: '', designation: '', role: '', assignedDepartment: ''
  });

  useEffect(() => {
    if (user) {
      setUserData({ ...user });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(userData); }} className="user-form">
      <TextField label="Username" name="username" value={userData.username} onChange={handleChange} fullWidth margin="normal" required />
      <TextField label="Name" name="name" value={userData.name} onChange={handleChange} fullWidth margin="normal" required />
      <TextField label="Phone" name="phone" value={userData.phone} onChange={handleChange} fullWidth margin="normal" required />
      <TextField label="Department" name="department" value={userData.department} onChange={handleChange} fullWidth margin="normal" required />
      <TextField label="Designation" name="designation" value={userData.designation} onChange={handleChange} fullWidth margin="normal" required />
      <TextField label="User Role" name="role" value={userData.role} onChange={handleChange} fullWidth margin="normal" required />
      <TextField label="Assigned Department" name="assignedDepartment" value={userData.assignedDepartment} onChange={handleChange} fullWidth margin="normal" required />
    </form>
  );
};

export default UserForm;
