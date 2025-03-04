import { useState, useEffect } from 'react';
import { fetchSettings, saveSettingsToServer, deleteDepartment, deleteDesignation, deleteReportingGroup } from '../services/settingsService';

export const useSettings = () => {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [reportingGroups, setReportingGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const settings = await fetchSettings();
        setDepartments(settings.departments || []);
        setDesignations(settings.designations || []);
        setReportingGroups(settings.reportingGroups || []);
      } catch (error) {
        setError('Failed to fetch settings');
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add a department locally (doesn't save to server yet)
  const handleAddDepartment = (newDepartment) => {
    setDepartments((prevDepartments) => [...prevDepartments, { name: newDepartment }]);
    setHasChanges(true);
  };

  // Add a designation locally (doesn't save to server yet)
  const handleAddDesignation = (newDesignation) => {
    setDesignations((prevDesignations) => [...prevDesignations, { designation_name: newDesignation }]);
    setHasChanges(true);
  };

  // Add a reporting group locally (doesn't save to server yet)
  const handleAddReportingGroup = (newReportingGroup) => {
    setReportingGroups((prevReportingGroups) => [
      ...prevReportingGroups, 
      { groupname: newReportingGroup }
    ]);
    setHasChanges(true);
  };
  
  

  // Delete department (if it has an ID, delete from server, otherwise just from local state)
  const handleDeleteDepartment = async (departmentToDelete) => {
    try {
      setLoading(true);
      if (departmentToDelete.id) {
        // Delete from server
        await deleteDepartment(departmentToDelete.id);
        // Refresh data after server-side deletion
        const settings = await fetchSettings();
        setDepartments(settings.departments || []);
        setDesignations(settings.designations || []);
      } else {
        // Delete locally (if no ID exists)
        setDepartments((prevDepartments) => prevDepartments.filter(department => department.name !== departmentToDelete.name));
        setHasChanges(true);
      }
    } catch (error) {
      setError('Failed to delete department');
      console.error('Error deleting department:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete designation (if it has an ID, delete from server, otherwise just from local state)
  const handleDeleteDesignation = async (designationToDelete) => {
    try {
      setLoading(true);
      if (designationToDelete.id) {
        // Delete from server
        await deleteDesignation(designationToDelete.id);
        // Refresh data after server-side deletion
        const settings = await fetchSettings();
        setDepartments(settings.departments || []);
        setDesignations(settings.designations || []);
      } else {
        // Delete locally (if no ID exists)
        setDesignations((prevDesignations) => prevDesignations.filter(designation => designation.designation_name !== designationToDelete.designation_name));
        setHasChanges(true);
      }
    } catch (error) {
      setError('Failed to delete designation');
      console.error('Error deleting designation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete a reporting group (if it has an ID, delete from server, otherwise just from local state)
  const handleDeleteReportingGroup = async (reportingGroupToDelete) => {
    try {
      setLoading(true);
      if (reportingGroupToDelete.id) {
        // Delete from server
        await deleteReportingGroup(reportingGroupToDelete.id);
        // Refresh data after server-side deletion
        const settings = await fetchSettings();
        setDepartments(settings.departments || []);
        setDesignations(settings.designations || []);
        setReportingGroups(settings.reportingGroups || []); 
      } else {
        // Delete locally (if no ID exists)
        setReportingGroups((prevReportingGroups) => prevReportingGroups.filter(reportingGroup => reportingGroup.groupname !== reportingGroupToDelete.groupname));


        setHasChanges(true);
      }
    } catch (error) {
      setError('Failed to delete reporting group');
      console.error('Error deleting reporting group:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save all settings to the server
  const saveSettings = async () => {
    console.log('Saving settings:', { departments, designations });
    try {
      setLoading(true);
      setError(null);
      
      // Format the data as expected by the server
      const cleanDepartments = departments.map(dept => ({
        ...(dept.id && { id: dept.id }), // Include ID if it exists
        name: dept.name
      }));
      
      const cleanDesignations = designations.map(desig => ({
        ...(desig.id && { id: desig.id }), // Include ID if it exists
        designation_name: desig.designation_name
      }));

      const cleanReportingGroups = reportingGroups.map(group => ({
        ...(group.id && { id: group.id }), // Include ID if it exists
        groupname: group.groupname
      }));
      
      // Send to server using POST (as per your router configuration)
      await saveSettingsToServer(cleanDepartments, cleanDesignations, cleanReportingGroups);
      
      // Refresh data after saving
      const settings = await fetchSettings();
      setDepartments(settings.departments || []);
      setDesignations(settings.designations || []);
      setReportingGroups(settings.reportingGroups || []);
      setHasChanges(false);
    } catch (error) {
      setError('Failed to save settings');
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    departments,
    designations,
    reportingGroups,
    loading,
    error,
    handleAddDepartment,
    handleAddDesignation,
    handleAddReportingGroup,
    handleDeleteDepartment,
    handleDeleteDesignation,
    handleDeleteReportingGroup,
    saveSettings,
    hasChanges
  };
};
