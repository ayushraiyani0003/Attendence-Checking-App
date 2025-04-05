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

export const EmployeeProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeesData();
  }, []);

  const fetchEmployeesData = async () => {
    try {
      const data = await fetchGroupEmployees();
      setEmployees(data);
      setLoading(false);
    } catch (error) {
      notification.error({ message: "Failed to load employees" });
      setLoading(false);
    }
  };

  const addNewEmployee = async (employeeData) => {
    try {
      // console.log(employeeData);
      const newEmployee = await createEmployee(employeeData);
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
    try {
      const updatedEmployee = await modifyEmployee(employeeId, updatedData);
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
  }

  return (
    <EmployeeContext.Provider
      value={{
        employees,
        loading,
        addNewEmployee, // Make sure this is included in the context value
        editEmployee,
        removeEmployeeById,
        fetchEmployeesByGroup
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};
