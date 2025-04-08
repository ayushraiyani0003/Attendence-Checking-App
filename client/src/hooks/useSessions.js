// hooks/useSessionManagement.js
import { useState } from 'react';
import { useSession } from '../context/SessionsContext';

export const useSessionManagement = () => {
  const { 
    isLoading, 
    error, 
    deleteAllSessions, 
    deleteUserSessions, 
    deleteInactiveSessions, 
    deleteOldSessions 
  } = useSession();
  
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Toggle user selection for bulk deletion
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  // Clear all selections
  const clearSelections = () => {
    setSelectedUsers([]);
  };
  
  // Delete sessions for multiple selected users
  const deleteMultipleUserSessions = async () => {
    if (selectedUsers.length === 0) return;
    
    const results = [];
    for (const userId of selectedUsers) {
      try {
        const result = await deleteUserSessions(userId);
        results.push({ userId, success: true, message: result.message });
      } catch (err) {
        results.push({ userId, success: false, message: err.message });
      }
    }
    
    clearSelections();
    return results;
  };
  
  return {
    isLoading,
    error,
    selectedUsers,
    toggleUserSelection,
    clearSelections,
    deleteAllSessions,
    deleteUserSessions,
    deleteInactiveSessions,
    deleteOldSessions,
    deleteMultipleUserSessions
  };
};