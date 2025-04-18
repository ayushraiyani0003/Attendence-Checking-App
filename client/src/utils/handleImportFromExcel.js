import * as XLSX from 'xlsx';
import { notification, message } from 'antd';
import dayjs from 'dayjs';

// Modified to handle both adding and updating employees
const handleImportFromExcel = (employees, addEmployee, editEmployee) => {
  // Create file input element
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.xlsx, .xls';
  
  fileInput.onchange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      // Show loading message
      const key = 'importLoading';
      message.loading({ content: 'Processing Excel file...', key, duration: 0 });
      
      // Read the Excel file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          let addedCount = 0;
          let updatedCount = 0;
          let errorCount = 0;
          
          // Process each row
          for (const row of jsonData) {
            try {
              // Map Excel columns to employee data structure
              const employeeData = {
                employeeId: row['EmployeeId'] || '',
                punch_code: row['Punch Code'] || '',
                name: row['Name'] || '',
                department: row['Department'] || '',
                designation: row['Designation'] || '',
                mobile_number: row['Mobile No.'] || '',  // Added mobile number field
                whats_app_number: row['whatsApp number'] || '',  // Added mobile number field
                net_hr: row['Net Hours'] || 0,
                branch: row['Branch'] || '',
                sections: row['Sections'] || '',
                week_off: row['Week Off'] || 'Sunday',
                reporting_group: row['Reporting Group'] || '',
                status: row['Status'] || 'active'
              };
              
              // Handle resign date properly if it exists
              if (row['Resign Date']) {
                // If it's already a string in YYYY-MM-DD format
                if (typeof row['Resign Date'] === 'string') {
                  employeeData.resign_date = row['Resign Date'];
                } 
                // If it's a date object from Excel
                else if (row['Resign Date'] instanceof Date) {
                  employeeData.resign_date = dayjs(row['Resign Date']).format('YYYY-MM-DD');
                }
              } else {
                employeeData.resign_date = null;
              }
              
              // Validate required fields
              if (!employeeData.name || !employeeData.punch_code || 
                  !employeeData.department || !employeeData.designation || 
                  !employeeData.reporting_group) {
                console.warn('Missing required fields for row:', row);
                errorCount++;
                continue;
              }
              
              // Check if employee exists (by employeeId)
              const existingEmployee = employees.find(
                emp => emp.employee_id === employeeData.employeeId
              );
              
              if (existingEmployee && employeeData.employeeId) {
                // Employee exists - update using employee_id as shown in handleSubmit
                await editEmployee(existingEmployee.employee_id, employeeData);
                updatedCount++;
              } else {
                // Employee doesn't exist - add new
                await addEmployee(employeeData);
                addedCount++;
              }
            } catch (error) {
              console.error('Error processing row:', row, error);
              errorCount++;
            }
          }
          
          // Close loading message
          message.success({ content: 'Processing complete!', key, duration: 2 });
          
          // Show results notification
          if (addedCount > 0 || updatedCount > 0) {
            notification.success({
              message: 'Import Successful',
              description: `Successfully imported ${addedCount} new employees and updated ${updatedCount} existing employees. ${errorCount > 0 ? `Failed to process ${errorCount} entries.` : ''}`,
              placement: 'bottomRight',
            });
          } else {
            notification.error({
              message: 'Import Failed',
              description: 'No employees were imported or updated. Please check your Excel file format.',
              placement: 'bottomRight',
            });
          }
        } catch (error) {
          // Close loading message with error
          message.error({ content: 'Processing failed!', key, duration: 2 });
          
          notification.error({
            message: 'Import Failed',
            description: 'Error processing Excel file. Please check the format.',
            placement: 'bottomRight',
          });
          console.error('Excel processing error:', error);
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      notification.error({
        message: 'Import Failed',
        description: 'Error reading file. Please try again.',
        placement: 'bottomRight',
      });
      console.error('File reading error:', error);
    }
  };
  
  // Trigger file input click
  fileInput.click();
};

export default handleImportFromExcel;