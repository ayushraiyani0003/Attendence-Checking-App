import React, { useState } from "react";
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Stack,
    Grid,
    Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSettings } from "../../hooks/useSettings";
import "./SettingPage.css";

function SettingsPage() {
    const {
        departments,
        designations,
        reportingGroups,
        divisions,
        loading,
        error,
        handleAddDepartment,
        handleAddDesignation,
        handleAddReportingGroup,
        handleAddDivision,
        handleDeleteDepartment,
        handleDeleteDesignation,
        handleDeleteReportingGroup,
        handleDeleteDivision,
        saveSettings,
    } = useSettings();

    const [newDepartment, setNewDepartment] = useState("");
    const [newDesignation, setNewDesignation] = useState("");
    const [newReportingGroup, setNewReportingGroup] = useState("");
    const [newDivision, setNewDivision] = useState("");
    // Delete department locally or via server depending on if it has an id
    const handleDepartmentDelete = (department) => {
        if (department.id) {
            handleDeleteDepartment(department);
        } else {
            // Handle local deletion if no id exists
            handleDeleteDepartment(department); // This might already handle it if no id is passed.
        }
    };

    // Delete designation locally or via server depending on if it has an id
    const handleDesignationDelete = (designation) => {
        if (designation.id) {
            handleDeleteDesignation(designation);
        } else {
            // Handle local deletion if no id exists
            handleDeleteDesignation(designation); // This might already handle it if no id is passed.
        }
    };

    const handleReportingGroupDelete = (reportingGroup) => {
        if (reportingGroup.id) {
            handleDeleteReportingGroup(reportingGroup);
        } else {
            handleDeleteReportingGroup(reportingGroup);
        }
    };

    const handleDivisionDelete = (division) => {
        if (division.id) {
            handleDeleteDivision(division);
        } else {
            handleDeleteDivision(division);
        }
    };

    return (
        <div className="settings-page user-list-page">
            <Box sx={{ py: 4 }}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography
                        variant="h5"
                        component="h1"
                        sx={{ fontWeight: 600, mb: 4 }}
                    >
                        System Settings
                    </Typography>

                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <Box
                                sx={{
                                    p: 3,
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 2,
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{ mb: 2, fontWeight: 500 }}
                                >
                                    Designations
                                </Typography>
                                <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                                    <TextField
                                        label="New Designation"
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        value={newDesignation}
                                        onChange={(e) =>
                                            setNewDesignation(e.target.value)
                                        }
                                    />
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                            if (newDesignation) {
                                                handleAddDesignation(
                                                    newDesignation
                                                );
                                                setNewDesignation("");
                                            }
                                        }}
                                        sx={{
                                            backgroundColor: "#1976d2",
                                            "&:hover": {
                                                backgroundColor: "#1565c0",
                                            },
                                        }}
                                    >
                                        Add
                                    </Button>
                                </Box>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    flexWrap="wrap"
                                >
                                    {designations.map((designation, index) => (
                                        <Chip
                                            key={index}
                                            label={designation.designation_name}
                                            onDelete={() =>
                                                handleDesignationDelete(
                                                    designation
                                                )
                                            }
                                            deleteIcon={<DeleteIcon />}
                                            sx={{
                                                marginTop: 1,
                                                marginBottom: 1,
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box
                                sx={{
                                    p: 3,
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 2,
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{ mb: 2, fontWeight: 500 }}
                                >
                                    Departments
                                </Typography>
                                <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                                    <TextField
                                        label="New Department"
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        value={newDepartment}
                                        onChange={(e) =>
                                            setNewDepartment(e.target.value)
                                        }
                                    />
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                            if (newDepartment) {
                                                handleAddDepartment(
                                                    newDepartment
                                                );
                                                setNewDepartment("");
                                            }
                                        }}
                                        sx={{
                                            backgroundColor: "#1976d2",
                                            "&:hover": {
                                                backgroundColor: "#1565c0",
                                            },
                                        }}
                                    >
                                        Add
                                    </Button>
                                </Box>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    flexWrap="wrap"
                                >
                                    {departments.map((department, index) => (
                                        <Chip
                                            key={index}
                                            label={department.name}
                                            onDelete={() =>
                                                handleDepartmentDelete(
                                                    department
                                                )
                                            }
                                            deleteIcon={<DeleteIcon />}
                                            sx={{
                                                marginTop: 1,
                                                marginBottom: 1,
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box
                                sx={{
                                    p: 3,
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 2,
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{ mb: 2, fontWeight: 500 }}
                                >
                                    Reporting Groups
                                </Typography>{" "}
                                {/* Fixed label */}
                                <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                                    <TextField
                                        label="New Reporting Group"
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        value={newReportingGroup}
                                        onChange={(e) =>
                                            setNewReportingGroup(e.target.value)
                                        }
                                    />
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                            if (newReportingGroup) {
                                                handleAddReportingGroup(
                                                    newReportingGroup
                                                );
                                                setNewReportingGroup("");
                                            }
                                        }}
                                        sx={{
                                            backgroundColor: "#1976d2",
                                            "&:hover": {
                                                backgroundColor: "#1565c0",
                                            },
                                        }}
                                    >
                                        Add
                                    </Button>
                                </Box>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    flexWrap="wrap"
                                >
                                    {/* Ensure reportingGroups is an array */}
                                    {Array.isArray(reportingGroups) &&
                                        reportingGroups.map(
                                            (reportingGroup, index) => (
                                                <Chip
                                                    key={index}
                                                    label={
                                                        reportingGroup.groupname ||
                                                        reportingGroup
                                                    } // Change to use groupname
                                                    onDelete={() =>
                                                        handleReportingGroupDelete(
                                                            reportingGroup
                                                        )
                                                    }
                                                    deleteIcon={<DeleteIcon />}
                                                    sx={{
                                                        marginTop: 1,
                                                        marginBottom: 1,
                                                    }}
                                                />
                                            )
                                        )}
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box
                                sx={{
                                    p: 3,
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 2,
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{ mb: 2, fontWeight: 500 }}
                                >
                                    Division
                                </Typography>{" "}
                                {/* Fixed label */}
                                <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                                    <TextField
                                        label="New Division"
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        value={newDivision}
                                        onChange={(e) =>
                                            setNewDivision(e.target.value)
                                        }
                                    />
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                            if (newDivision) {
                                                handleAddDivision(newDivision);
                                                setNewDivision("");
                                            }
                                        }}
                                        sx={{
                                            backgroundColor: "#1976d2",
                                            "&:hover": {
                                                backgroundColor: "#1565c0",
                                            },
                                        }}
                                    >
                                        Add
                                    </Button>
                                </Box>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    flexWrap="wrap"
                                >
                                    {/* Ensure reportingGroups is an array */}
                                    {console.log(divisions)}
                                    {Array.isArray(divisions) &&
                                        divisions.map((division, index) => (
                                            <Chip
                                                key={index}
                                                label={
                                                    division.name || division
                                                } // Keep as division.name since backend uses 'name'
                                                onDelete={() =>
                                                    handleDivisionDelete(
                                                        division
                                                    )
                                                }
                                                deleteIcon={<DeleteIcon />}
                                                sx={{
                                                    marginTop: 1,
                                                    marginBottom: 1,
                                                }}
                                            />
                                        ))}
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>

                    {error && (
                        <Typography color="error" variant="body2">
                            {error}
                        </Typography>
                    )}

                    <Button
                        variant="contained"
                        sx={{
                            mt: 4,
                            backgroundColor: "#1976d2",
                            "&:hover": { backgroundColor: "#1565c0" },
                        }}
                        disabled={loading}
                        onClick={saveSettings} // Add onClick to trigger saving settings
                    >
                        {loading ? "Saving..." : "Save Settings"}
                    </Button>
                </Paper>
            </Box>
        </div>
    );
}

export default SettingsPage;
