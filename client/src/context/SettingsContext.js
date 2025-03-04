import { useState, useEffect } from 'react';
import { fetchSettings, addDepartment, addDesignation, deleteDepartment, deleteDesignation } from '../services/settingsService';

export const useSettings = () => {
  const [departments, setDepartments] = useState([]);  // Initialize as an empty array
  const [designations, setDesignations] = useState([]);  // Initialize as an empty array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportingGroups, setReportingGroups] = useState([]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const settings = await fetchSettings();
        setDepartments(settings.departments || []);  // Ensure it's an array even if data is missing
        setDesignations(settings.designations || []);  // Ensure it's an array even if data is missing
        setReportingGroups(settings.reportingGroups || []);
      } catch (error) {
        setError('Failed to fetch settings');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddDepartment = async (newDepartment) => {
    try {
      const updatedDepartments = await addDepartment(newDepartment);
      setDepartments(updatedDepartments);
    } catch (error) {
      setError('Failed to add department');
    }
  };

  const handleAddDesignation = async (newDesignation) => {
    try {
      const updatedDesignations = await addDesignation(newDesignation);
      setDesignations(updatedDesignations);
    } catch (error) {
      setError('Failed to add designation');
    }
  };

  const handleAddReportingGroup = async (newReportingGroup) => {
    try {
      const updatedReportingGroups = await addReportingGroup(newReportingGroup);
      setReportingGroups(updatedReportingGroups);
    } catch (error) {
      setError('Failed to add reporting group');  
    }
  };

  const handleDeleteDepartment = async (departmentToDelete) => {
    try {
      const updatedDepartments = await deleteDepartment(departmentToDelete);
      setDepartments(updatedDepartments);
    } catch (error) {
      setError('Failed to delete department');
    }
  };

  const handleDeleteDesignation = async (designationToDelete) => {
    try {
      const updatedDesignations = await deleteDesignation(designationToDelete);
      setDesignations(updatedDesignations);
    } catch (error) {
      setError('Failed to delete designation');
    }
  };

  const handleDeleteReportingGroup = async (reportingGroupToDelete) => {
    try {
      const updatedReportingGroups = await deleteReportingGroup(reportingGroupToDelete);
      setReportingGroups(updatedReportingGroups);
    } catch (error) {
      setError('Failed to delete reporting group');
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
  };
};
