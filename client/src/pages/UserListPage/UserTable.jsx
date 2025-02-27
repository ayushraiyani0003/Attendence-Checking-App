import React, { useState } from 'react'
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, TablePagination, TextField, Box, Tooltip, Chip
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { format } from 'date-fns'

function UserTable({ onEdit, onDelete, users }) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [searchTerm, setSearchTerm] = useState('')

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const filteredUsers = users.filter(user => 
    Object.values(user).some(value => 
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
        />
      </Box>
      
      <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Phone No</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Designation</TableCell>
              <TableCell>User Role</TableCell>
              <TableCell>Assigned Departments</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.phoneNo}</TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell>{user.designation}</TableCell>
                <TableCell>{user.userRole}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {user.assignedDepartments.map((dept, index) => (
                      <Chip 
                        key={index}
                        label={dept}
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Tooltip title={user.lastLogin ? format(new Date(user.lastLogin), 'PPpp') : 'Never'}>
                    <span>
                      {user.lastLogin ? format(new Date(user.lastLogin), 'dd/MM/yyyy HH:mm') : 'Never'}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => onEdit(user)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => onDelete(user.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </>
  )
}

export default UserTable