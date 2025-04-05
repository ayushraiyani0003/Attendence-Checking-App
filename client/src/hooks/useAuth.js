import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const useAuth = () => {
  const { 
    isAuthenticated, 
    login, 
    logout, 
    user,
    userRole,
    groupName 
  } = useContext(AuthContext);
  
  return {
    isAuthenticated,
    login,
    logout,
    user,
    userRole,
    groupName
  };
};

export default useAuth;