import React, { useState } from 'react';
import UserTable from './UserTable';
import UserForm from './UserForm';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Paper, 
  useTheme,
  useMediaQuery,
  Fade,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import './UserListPage.css';

function UserListPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
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
  ];

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsEditUserOpen(true);
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
            <Box sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between', 
              alignItems: isMobile ? 'flex-start' : 'center', 
              mb: 4,
              gap: isMobile ? 2 : 0
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white', 
                  p: 1.5, 
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PeopleAltIcon fontSize="medium" />
                </Box>
                <Box>
                  <Typography 
                    variant="h4" 
                    component="h1" 
                    sx={{ 
                      fontWeight: 700,
                      color: 'text.primary',
                      fontSize: { xs: '1.5rem', md: '2rem' }
                    }}
                  >
                    User Management
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      mt: 0.5
                    }}
                  >
                    Manage your team members and their permissions
                  </Typography>
                </Box>
              </Box>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsAddUserOpen(true)}
                sx={{
                  py: 1.5,
                  px: 3,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)',
                  background: 'linear-gradient(45deg, #1976d2, #2196f3)',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 15px rgba(25, 118, 210, 0.4)',
                  }
                }}
              >
                Add New User
              </Button>
            </Box>
            
            <Divider sx={{ mb: 4, opacity: 0.6 }} />
            
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
            setIsEditUserOpen(false);
            setSelectedUser(null);
          }}
          mode="edit"
          userData={selectedUser}
        />
      </Container>
    </Fade>
  );
}

export default UserListPage;