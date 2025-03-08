import { useState, useEffect } from 'react';
import { getAllUsers, createUser, updateUser, deleteUser, getStaticData } from '../services/userServices';

// Custom Hook to get all users
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, fetchUsers };
};

// Custom Hook to add a new user
export const useAddUser = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);
  const { fetchUsers } = useUsers();  // Get the fetchUsers function to refetch after adding

  const addUser = async (userData) => {
    setIsAdding(true);
    try {
      await createUser(userData);
      await fetchUsers();  // Refetch the users after adding a new user
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  return { addUser, isAdding, error };
};

// Custom Hook to update an existing user
export const useUpdateUser = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const { fetchUsers } = useUsers();  // Get the fetchUsers function to refetch after updating

  const updateUserHandler = async (id, userData) => {
    setIsUpdating(true);
    try {
      await updateUser(id, userData);
      await fetchUsers();  // Refetch the users after updating
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateUserHandler, isUpdating, error };
};

// Custom Hook to delete a user
export const useDeleteUser = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const { fetchUsers } = useUsers();  // Get the fetchUsers function to refetch after deleting

  const deleteUserHandler = async (id) => {
    setIsDeleting(true);
    try {
      await deleteUser(id);
      await fetchUsers();  // Refetch the users after deleting
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteUserHandler, isDeleting, error };
};

// Custom Hook to get departments, designations, and reporting groups
export const useStaticData = () => {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [reportingGroups, setReportingGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch static data when the component mounts
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const data = await getStaticData();
        setDepartments(data.departments);
        setDesignations(data.designations);
        setReportingGroups(data.reportingGroups);
      } catch (err) {
        setError('Error fetching static data');
      } finally {
        setLoading(false);
      }
    };

    fetchStaticData();
  }, []);

  // Return the data, loading state, and error state
  return { departments, designations, reportingGroups, loading, error };
};
