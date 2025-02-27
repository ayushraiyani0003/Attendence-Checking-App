import React, { useState } from 'react'
import { Box, Button, TextField, Typography, Container, Paper, IconButton, Chip, Stack, Grid } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import './SettingPage.css'

function SettingsPage() {
  const [designations, setDesignations] = useState(['Senior Engineer', 'Junior Developer'])
  const [departments, setDepartments] = useState(['Engineering', 'QA'])
  const [newDesignation, setNewDesignation] = useState('')
  const [newDepartment, setNewDepartment] = useState('')

  const handleAddDesignation = () => {
    if (newDesignation && !designations.includes(newDesignation)) {
      setDesignations([...designations, newDesignation])
      setNewDesignation('')
    }
  }

  const handleAddDepartment = () => {
    if (newDepartment && !departments.includes(newDepartment)) {
      setDepartments([...departments, newDepartment])
      setNewDepartment('')
    }
  }

  const handleDeleteDesignation = (designationToDelete) => {
    setDesignations(designations.filter(d => d !== designationToDelete))
  }

  const handleDeleteDepartment = (departmentToDelete) => {
    setDepartments(departments.filter(d => d !== departmentToDelete))
  }

  return (
    <div className="user-list-page">
      <Box sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600, mb: 4 }}>
            System Settings
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>Designations</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <TextField
                    label="New Designation"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddDesignation}
                    sx={{
                      backgroundColor: '#1976d2',
                      '&:hover': { backgroundColor: '#1565c0' }
                    }}
                  >
                    Add
                  </Button>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: '8px !important' }}>
                  {designations.map((designation, index) => (
                    <Chip
                      key={index}
                      label={designation}
                      onDelete={() => handleDeleteDesignation(designation)}
                      deleteIcon={<DeleteIcon />}
                      sx={{ 
                        mb: 1,
                        '& .MuiChip-deleteIcon': {
                          color: '#ff4d4f',
                          '&:hover': {
                            color: '#ff7875'
                          }
                        }
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>Departments</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <TextField
                    label="New Department"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddDepartment}
                    sx={{
                      backgroundColor: '#1976d2',
                      '&:hover': { backgroundColor: '#1565c0' }
                    }}
                  >
                    Add
                  </Button>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: '8px !important' }}>
                  {departments.map((department, index) => (
                    <Chip
                      key={index}
                      label={department}
                      onDelete={() => handleDeleteDepartment(department)}
                      deleteIcon={<DeleteIcon />}
                      sx={{ 
                        mb: 1,
                        '& .MuiChip-deleteIcon': {
                          color: '#ff4d4f',
                          '&:hover': {
                            color: '#ff7875'
                          }
                        }
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </div>
  )
}

export default SettingsPage
