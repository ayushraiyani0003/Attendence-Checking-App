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
  } = useEmployeeContext(); // Make sure this hook is correctly accessing context
  const [error, setError] = useState("");

  useEffect(() => {
    if (!employees) {
      setError("Failed to load employees");
    }
  }, [employees]);

  const addEmployee = async (employeeData) => {
    try {
      await addNewEmployee(employeeData); // This should call the context function
    } catch (error) {
      notification.error({ message: "Failed to add employee" });
    }
  };

  const editEmployeeById = async (employeeId, updatedData) => {
    try {
      await editEmployee(employeeId, updatedData); // This should call the context function
    } catch (error) {
      notification.error({ message: "Failed to update employee" });
    }
  };

  const removeEmployeeByIdHandler = async (employeeId) => {
    try {
      await removeEmployeeById(employeeId); // This should call the context function
    } catch (error) {
      notification.error({ message: "Failed to delete employee" });
    }
  };

  return {
    employees,
    loading,
    error,
    addEmployee,
    editEmployee: editEmployeeById,
    removeEmployee: removeEmployeeByIdHandler,
  };
};

export default useEmployee;
