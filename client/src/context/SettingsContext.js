import { useState, useEffect } from "react";
import {
  fetchSettings,
  deleteDepartment,
  deleteDesignation,
  deleteReportingGroup,
} from "../services/settingsService";

export const useSettings = () => {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [reportingGroups, setReportingGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const settings = await fetchSettings();
        setDepartments(settings.departments || []);
        setDesignations(settings.designations || []);
        setReportingGroups(settings.reportingGroups || []);
      } catch (error) {
        setError("Failed to fetch settings");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Method to add a new department (you might need to create an actual service for adding)
  const handleAddDepartment = async (newDepartment) => {
    try {
      // Update your logic here if an add method is created or handled in saveSettingsToServer
      const updatedDepartments = [...departments, newDepartment]; // Example of direct state modification
      setDepartments(updatedDepartments);
    } catch (error) {
      setError("Failed to add department");
    }
  };

  // Method to add a new designation
  const handleAddDesignation = async (newDesignation) => {
    try {
      const updatedDesignations = [...designations, newDesignation]; // Direct state modification example
      setDesignations(updatedDesignations);
    } catch (error) {
      setError("Failed to add designation");
    }
  };

  // Method to add a new reporting group
  const handleAddReportingGroup = async (newReportingGroup) => {
    try {
      const updatedReportingGroups = [...reportingGroups, newReportingGroup]; // Direct state modification example
      setReportingGroups(updatedReportingGroups);
    } catch (error) {
      setError("Failed to add reporting group");
    }
  };

  const handleDeleteDepartment = async (departmentToDelete) => {
    try {
      const updatedDepartments = await deleteDepartment(departmentToDelete);
      setDepartments(updatedDepartments);
    } catch (error) {
      setError("Failed to delete department");
    }
  };

  const handleDeleteDesignation = async (designationToDelete) => {
    try {
      const updatedDesignations = await deleteDesignation(designationToDelete);
      setDesignations(updatedDesignations);
    } catch (error) {
      setError("Failed to delete designation");
    }
  };

  const handleDeleteReportingGroup = async (reportingGroupToDelete) => {
    try {
      const updatedReportingGroups = await deleteReportingGroup(
        reportingGroupToDelete
      );
      setReportingGroups(updatedReportingGroups);
    } catch (error) {
      setError("Failed to delete reporting group");
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
