import React from 'react';
import LoginForm from '../../components/LoginForm/LoginForm';

const LogInPage = ({ onLogin }) => {
  return (
    <div className="login-page">
      <LoginForm onLogin={onLogin} />
    </div>
  );
};

export default LogInPage;
