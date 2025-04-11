// handleImportFromExcel.js
import * as XLSX from 'xlsx';
import { notification, message } from 'antd';

// Modified to accept addEmployee as a parameter
const handleImportFromExcel = (addEmployee) => {
  // Create file input element
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.xlsx, .xls';
  
  fileInput.onchange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      // Show loading message instead of notification.loading
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
          
          let successCount = 0;
          let errorCount = 0;
          
          // Process each row
          for (const row of jsonData) {
            try {
              // Map Excel columns to employee data structure
              // Note: Adjust field names to match your Excel headers exactly
              const employeeData = {
                punch_code: row['Punch Code'] || '',
                name: row['Name'] || '',
                department: row['Department'] || '',
                designation: row['Designation'] || '',
                net_hr: row['Net-Work HR'] || 0,
                branch: row['Branch'] || '',
                sections: row['Section'] || '',
                week_off: row['Week-Off'] || 'Sunday',
                reporting_group: row['Reporting Group'] || '',
                status: 'active', // Default status
                resign_date: null  // Default resign date
              };
              
              // Validate required fields
              if (!employeeData.name || !employeeData.punch_code || 
                  !employeeData.department || !employeeData.designation || 
                  !employeeData.reporting_group) {
                console.warn('Missing required fields for row:', row);
                errorCount++;
                continue;
              }
              
              // Add employee to the system
              await addEmployee(employeeData);
              successCount++;
            } catch (error) {
              console.error('Error processing row:', row, error);
              errorCount++;
            }
          }
          
          // Close loading message
          message.success({ content: 'Processing complete!', key, duration: 2 });
          
          // Show results notification
          if (successCount > 0) {
            notification.success({
              message: 'Import Successful',
              description: `Successfully imported ${successCount} employees. ${errorCount > 0 ? `Failed to import ${errorCount} employees.` : ''}`,
              placement: 'bottomRight',
            });
          } else {
            notification.error({
              message: 'Import Failed',
              description: 'No employees were imported. Please check your Excel file format.',
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