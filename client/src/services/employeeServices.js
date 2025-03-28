import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL;
// Replace with your actual API URL

export const getEmployees = async () => {
  const response = await axios.get(`${API_URL}/employees`);
  console.log("response", response);
  return response.data.employees;
};

export const addEmployee = async (employeeData) => {
  console.log("employe data services : " + employeeData);

  const response = await axios.post(`${API_URL}/employees`, employeeData);
  return response.data.employee;
};

export const updateEmployee = async (employeeId, updatedData) => {
  const response = await axios.put(
    `${API_URL}/employees/${employeeId}`,
    updatedData
  );
  return response.data.employee;
};

export const deleteEmployee = async (employeeId) => {
  await axios.delete(`${API_URL}/employees/${employeeId}`);
};
