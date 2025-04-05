import { useState, useEffect } from "react";
import { notification } from "antd";
import { useEmployeeContext } from "../context/EmployeeContext";

const useEmployee = () => {
  const {
    employees,
    loading,
    addNewEmployee,
    editEmployee,
    removeEmployeeById,
    fetchEmployeesByGroup
  } = useEmployeeContext();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!employees) {
      setError("Failed to load employees");
    }
  }, [employees]);

  const addEmployee = async (employeeData) => {
    try {
      // Make sure all fields are included
      const completeEmployeeData = {
        name: employeeData.name,
        department: employeeData.department,
        punch_code: employeeData.punch_code,
        designation: employeeData.designation,
        reporting_group: employeeData.reporting_group,
        net_hr: employeeData.net_hr,
        week_off: employeeData.week_off,
        resign_date: employeeData.resign_date,
        status: employeeData.status || 'active',
        branch: employeeData.branch,
        sections: employeeData.sections
      };
      
      await addNewEmployee(completeEmployeeData);
    } catch (error) {
      notification.error({ message: "Failed to add employee" });
    }
  };

  const editEmployeeById = async (employeeId, updatedData) => {
    try {
      // Make sure all fields are included in the update
      const completeUpdateData = {
        name: updatedData.name,
        department: updatedData.department,
        punch_code: updatedData.punch_code,
        designation: updatedData.designation,
        reporting_group: updatedData.reporting_group,
        net_hr: updatedData.net_hr,
        week_off: updatedData.week_off,
        resign_date: updatedData.resign_date,
        status: updatedData.status,
        branch: updatedData.branch,
        sections: updatedData.sections
      };
      
      await editEmployee(employeeId, completeUpdateData);
    } catch (error) {
      notification.error({ message: "Failed to update employee" });
    }
  };

  const removeEmployeeByIdHandler = async (employeeId) => {
    try {
      await removeEmployeeById(employeeId);
    } catch (error) {
      notification.error({ message: "Failed to delete employee" });
    }
  };
  
  const getEmployeesByGroup = async (groupsName) => {
    try {
      await fetchEmployeesByGroup(groupsName);
    } catch (error) {
      notification.error({ message: "Failed to fetch employees by group" });
    }
  };

  return {
    employees,
    loading,
    error,
    addEmployee,
    editEmployee: editEmployeeById,
    removeEmployee: removeEmployeeByIdHandler,
    getEmployeesByGroup
  };
};

export default useEmployee;