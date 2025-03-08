import React, { useState } from 'react';
import { useUsers, useAddUser, useUpdateUser, useDeleteUser } from '../../hooks/userList';
import UserTable from './UserTable';
import UserForm from './UserForm';
import { Box, Button, Container, Typography, Paper, useTheme, useMediaQuery, Fade, CircularProgress, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

function UserListPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Use custom hooks
  const { users, loading, error, fetchUsers } = useUsers();
  const { addUser, isAdding, addUserError } = useAddUser();
  const { updateUserHandler, isUpdating, updateUserError } = useUpdateUser();
  const { deleteUserHandler, isDeleting, deleteUserError } = useDeleteUser();

  // Handle Add User
  const handleAddUser = async (newUserData) => {
    try {
      await addUser(newUserData);
      fetchUsers(); // Refetch the list of users after adding a new user
      setIsAddUserOpen(false); // Close the form
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Update User
  const handleUpdateUser = async (updatedData) => {
    if (selectedUser && selectedUser.id) {
      try {
        await updateUserHandler(selectedUser.id, updatedData);
        fetchUsers(); // Refetch the list of users after updating a user
        setIsAddUserOpen(false); // Close the form
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (id) => {
    try {
      await deleteUserHandler(id);
      fetchUsers(); // Refetch the list of users after deleting a user
    } catch (err) {
      console.error(err);
    }
  };

  // Open the UserForm for adding or editing
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setIsAddUserOpen(true); // Open dialog in "edit" mode
  };

  // Close the UserForm without making changes and reset selectedUser
  const handleCloseAddUser = () => {
    setIsAddUserOpen(false);
    setSelectedUser(null); // Reset selectedUser to ensure the form is empty
  };

  // Open form in "add" mode (empty form)
  const handleOpenAddUser = () => {
    setSelectedUser(null);  // Reset the form when opening the "Add New User" form
    setIsAddUserOpen(true);  // Open the form in "add" mode
  };

  return (
    <Fade in={true} timeout={800}>
      <Container maxWidth="xl" className="user-list-page">
        <Box sx={{ py: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 4 },
              borderRadius: 3,
              background: 'linear-gradient(to right, #ffffff, #f8f9fa)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" color="textPrimary">User Management</Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenAddUser}  // Open form in "add" mode with reset
              >
                Add New User
              </Button>
            </Box>

            {loading ? (
              <CircularProgress />
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <UserTable users={users} onEdit={handleUserSelect} onDelete={handleDeleteUser} />
            )}
          </Paper>
        </Box>

        {/* Add/Edit User Form Dialog */}
        <UserForm
          open={isAddUserOpen}
          onClose={handleCloseAddUser}
          mode={selectedUser ? 'edit' : 'add'}
          userData={selectedUser} // Pass selectedUser for editing
          onSubmit={selectedUser ? handleUpdateUser : handleAddUser} // Add or Edit
          isAdding={isAdding}
          isUpdating={isUpdating}
          error={addUserError || updateUserError}
        />
      </Container>
    </Fade>
  );
}

export default UserListPage;
