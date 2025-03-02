import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const useAuth = () => {
  const { isAuthenticated, login, logout, user } = useContext(AuthContext);
  
  return {
    isAuthenticated,
    login,
    logout,
    user,
  };
};

export default useAuth;
