import React, { createContext, useContext, useState, useEffect } from "react";
import { notification } from "antd";
import {
  getEmployees as fetchEmployees,
  addEmployee as createEmployee,
  deleteEmployee as removeEmployee,
  updateEmployee as modifyEmployee,
  GroupEmployees as fetchGroupEmployees 
} from "../services/employeeServices"; // Import service functions

const EmployeeContext = createContext();

export const useEmployeeContext = () => {
  return useContext(EmployeeContext);
};

export const EmployeeProvider = ({ children, userRole, userReportingGroup }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchInitialEmployees();
  }, [userRole, userReportingGroup]);

  const fetchInitialEmployees = async () => {
    try {
      // If user is admin, fetch all employees, otherwise fetch only their reporting group
      if (isAdmin) {
        await fetchEmployeesData();
      } else if (userReportingGroup) {
        await fetchEmployeesByGroup(userReportingGroup);
      } else {
        notification.warning({ message: "No reporting group assigned" });
        setLoading(false);
      }
    } catch (error) {
      notification.error({ message: "Failed to load employees" });
      setLoading(false);
    }
  };

  const fetchEmployeesData = async () => {
    try {
      const data = await fetchEmployees();
      setEmployees(data);
      setLoading(false);
    } catch (error) {
      notification.error({ message: "Failed to load employees" });
      setLoading(false);
    }
  };

  const addNewEmployee = async (employeeData) => {
    // console.log(employeeData);
    
    try {
      // Prepare employee data with all fields including new ones
      // Note: mobile_no and whatsApp_no are now optional
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
      
      // Only add mobile_no and whatsApp_no if they are provided
      if (employeeData.mobile_no) {
        completeEmployeeData.mobile_no = employeeData.mobile_no;
      }
      
      if (employeeData.whatsApp_no) {
        completeEmployeeData.whatsApp_no = employeeData.whatsApp_no;
      }
      
      const newEmployee = await createEmployee(completeEmployeeData);
      setEmployees([...employees, newEmployee]);

      notification.success({
        message: "Employee Added Successfully",
        description: `${newEmployee.name} has been added.`,
      });
    } catch (error) {
      notification.error({ message: "Failed to add employee" });
    }
  };

  const editEmployee = async (employeeId, updatedData) => {
    // console.log(updatedData);
    
    try {
      // Ensure required fields are included in the update
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
      
      // Only include mobile_no and whatsApp_no if they are provided
      if (updatedData.mobile_no !== undefined) {
        completeUpdateData.mobile_no = updatedData.mobile_no;
      }
      
      if (updatedData.whatsApp_no !== undefined) {
        completeUpdateData.whatsApp_no = updatedData.whatsApp_no;
      }
      
      const updatedEmployee = await modifyEmployee(employeeId, completeUpdateData);
      setEmployees(
        employees.map((emp) =>
          emp.employee_id === employeeId ? updatedEmployee : emp
        )
      );
      notification.success({
        message: "Employee Updated Successfully",
        description: `${updatedEmployee.name} has been updated.`,
      });
    } catch (error) {
      notification.error({ message: "Failed to update employee" });
    }
  };

  const removeEmployeeById = async (employeeId) => {
    try {
      await removeEmployee(employeeId);
      setEmployees(employees.filter((emp) => emp.employee_id !== employeeId));
      notification.success({
        message: "Employee Deleted Successfully",
        description: "Employee has been removed.",
      });
    } catch (error) {
      notification.error({ message: "Failed to delete employee" });
    }
  };

  const fetchEmployeesByGroup = async (groupsName) => {
    try {
      const data = await fetchGroupEmployees(groupsName);
      setEmployees(data);
      setLoading(false);
    } catch (error) {
      notification.error({ message: "Failed to load employees" });
      setLoading(false);
    }
  };

  return (
    <EmployeeContext.Provider
      value={{
        employees,
        loading,
        addNewEmployee,
        editEmployee,
        removeEmployeeById,
        fetchEmployeesByGroup,
        fetchEmployeesData,
        isAdmin
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};