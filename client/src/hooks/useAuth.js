import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const useAuth = () => {
  const { 
    isAuthenticated, 
    login,
    forceLogin,
    logout, 
    user,
    userRole,
    groupName 
  } = useContext(AuthContext);
  
  return {
    isAuthenticated,
    login,
    forceLogin,
    logout,
    user,
    userRole,
    groupName
  };
};

export default useAuth;