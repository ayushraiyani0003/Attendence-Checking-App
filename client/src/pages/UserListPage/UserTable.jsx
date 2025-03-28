import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Paper, 
  Chip, 
  Tooltip, 
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { format, formatDistanceToNow } from 'date-fns';

function UserTable({ onEdit, onDelete, users, isLoading = false }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredUsers = users.filter(user => 
    Object.values(user).some(value => 
      value && typeof value === 'object' ? 
        JSON.stringify(value).toLowerCase().includes(searchTerm.toLowerCase()) :
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const isUserActive = (lastLogin) => {
    if (!lastLogin) return false;
    const lastLoginDate = new Date(lastLogin);
    const daysDifference = (new Date() - lastLoginDate) / (1000 * 60 * 60 * 24);
    return daysDifference < 1;
  };
  
  const loadingRows = Array(rowsPerPage).fill(0).map((_, index) => (
    <TableRow key={`loading-${index}`}>
      {Array(10).fill(0).map((_, cellIndex) => (
        <TableCell key={`loading-cell-${cellIndex}`}>
          <Box className="loading-skeleton" sx={{ height: '20px', width: cellIndex === 9 ? '80px' : '100%' }}></Box>
        </TableCell>
      ))}
    </TableRow>
  ));

  return (
    <div>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search users by any field..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#1976d2',
              },
            }
          }}
        />
      </Box>
        <TableContainer sx={{ overflowX: 'auto' , overflowY: 'auto' }}>
          <Table className="user-table" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Reporting Groups</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? loadingRows : paginatedUsers.map((user) => {
                const isActive = isUserActive(user.lastLogin);
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FiberManualRecordIcon 
                          sx={{ 
                            fontSize: '10px', 
                            mr: 1, 
                            color: isActive ? '#4caf50' : '#bdbdbd' 
                          }} 
                        />
                        <Typography sx={{ fontWeight: 500 }}>
                          {user.username}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.phone_no}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{user.designation}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.user_role}
                        size="small"
                        color={user.user_role.toLowerCase().includes('admin') ? 'primary' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {user.user_role.toLowerCase().includes('admin') ? (
                          <Chip 
                            label="All Groups"
                            size="small"
                            sx={{ 
                              fontSize: '0.75rem',
                              backgroundColor: 'rgba(25, 118, 210, 0.08)',
                              color: '#1976d2',
                              fontWeight: 500,
                              '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.12)' }
                            }}
                          />
                        ) : (
                          user.reporting_group && user.reporting_group.map((dept, index) => (
                            <Chip 
                              key={index}
                              label={dept}
                              size="small"
                              sx={{ 
                                fontSize: '0.75rem',
                                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                color: '#1976d2',
                                fontWeight: 500,
                                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.12)' }
                              }}
                            />
                          ))
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ user.is_active == 1 ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{ 
                          backgroundColor: user.is_active ? 'rgba(76, 175, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                          color: user.is_active ? '#2e7d32' : '#757575',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {user.last_login ? (
                        <Tooltip 
                          title={format(new Date(user.last_login), 'PPpp')}
                          arrow
                        >
                          <Typography variant="body2" sx={{ cursor: 'default' }}>
                            {formatDistanceToNow(new Date(user.last_login), { addSuffix: true })}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#9e9e9e', fontStyle: 'italic' }}>
                          Never
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        onClick={() => onEdit(user)}
                        className="action-button edit"
                        size="small"
                        sx={{ 
                          color: '#757575',
                          '&:hover': { color: '#1976d2', backgroundColor: 'rgba(25, 118, 210, 0.08)' }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        onClick={() => onDelete(user.id)}
                        className="action-button delete"
                        size="small"
                        sx={{ 
                          color: '#757575', 
                          ml: 1,
                          '&:hover': { color: '#f44336', backgroundColor: 'rgba(244, 67, 54, 0.08)' }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && paginatedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="textSecondary">
                      {searchTerm ? 'No users match your search criteria' : 'No users available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              margin: 0
            }
          }}
        />
    </div>
  );
}

export default UserTable;