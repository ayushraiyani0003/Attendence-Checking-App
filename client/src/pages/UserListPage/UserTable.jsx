import React from 'react';
import { Button } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const UserTable = ({ users, onEdit, onDelete }) => {
  // Debug: Log the users data to check if it's correctly passed
  console.log("Users Data:", users);

  // Define column configurations for AG-Grid
  const columnDefs = [
    { headerName: "Username", field: "username", sortable: true, filter: true },
    { headerName: "Name", field: "name", sortable: true, filter: true },
    { headerName: "Phone", field: "phone", sortable: true, filter: true },
    { headerName: "Department", field: "department", sortable: true, filter: true },
    { headerName: "Designation", field: "designation", sortable: true, filter: true },
    { headerName: "Role", field: "role", sortable: true, filter: true },
    { headerName: "Assigned Dept.", field: "assignedDepartment", sortable: true, filter: true },
    {
      headerName: "Actions", cellRendererFramework: (params) => (
        <div className="action-buttons">
          <Button onClick={() => onEdit(params.data)} startIcon={<Edit />} size="small">Edit</Button>
          <Button onClick={() => onDelete(params.data.id)} startIcon={<Delete />} size="small" color="error">Delete</Button>
        </div>
      )
    }
  ];

  return (
    <div className="ag-theme-alpine" style={{ height: '400px', width: '100%' }}>
      {/* Check if users data is not empty */}
      {users.length > 0 ? (
        <AgGridReact
          columnDefs={columnDefs}
          rowData={users} // Ensure this is correctly passed
          pagination={true}
          paginationPageSize={5}
          domLayout="autoHeight"
        />
      ) : (
        <div>No users available</div> // Fallback when no users
      )}
    </div>
  );
};

export default UserTable;
