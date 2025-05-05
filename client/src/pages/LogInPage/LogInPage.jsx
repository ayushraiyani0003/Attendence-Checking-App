import React from 'react';
import LoginForm from '../../components/LoginForm/LoginForm';

const LogInPage = ({ onLogin, onForceLogin }) => {
  return (
    <div className="login-page">
      <LoginForm onLogin={onLogin} onForceLogin={onForceLogin} />
    </div>
  );
};

export default LogInPage;
