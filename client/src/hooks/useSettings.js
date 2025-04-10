import { useState, useEffect } from 'react';
import { fetchSettings, saveSettingsToServer } from '../services/settingsService';

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

  // Handle department deletion (client-side only)
  const handleDeleteDepartment = (departmentToDelete) => {
    if (departmentToDelete.id) {
      setDepartments(departments.filter(dept => dept.id !== departmentToDelete.id));
    } else {
      setDepartments(departments.filter(dept => dept.name !== departmentToDelete.name));
    }
    setHasChanges(true);
  };

  // Handle designation deletion (client-side only)
  const handleDeleteDesignation = (designationToDelete) => {
    if (designationToDelete.id) {
      setDesignations(designations.filter(desig => desig.id !== designationToDelete.id));
    } else {
      setDesignations(designations.filter(desig => desig.designation_name !== designationToDelete.designation_name));
    }
    setHasChanges(true);
  };

  // Handle reporting group deletion (client-side only)
  const handleDeleteReportingGroup = (groupToDelete) => {
    if (groupToDelete.id) {
      setReportingGroups(reportingGroups.filter(group => group.id !== groupToDelete.id));
    } else {
      setReportingGroups(reportingGroups.filter(group => group.groupname !== groupToDelete.groupname));
    }
    setHasChanges(true);
  };

  // Save all settings to the server
  const saveSettings = async () => {
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