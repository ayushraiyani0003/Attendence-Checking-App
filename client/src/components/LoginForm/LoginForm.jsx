import React, { useState } from 'react';
import InputField from '../InputField/InputField';
import './LoginForm.css';

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');

const handleSubmit = (e) => {
  e.preventDefault();
  // console.log('Login attempt with in form username:', username, 'and password:', password);
  onLogin( username, password )
    .then(() => {
      setUsername('');
      setPassword('');
      setError('');  // Clear error if login is successful
    })
    .catch((error) => {
      setError('Invalid username or password.');  // Set error message
      console.error('Login failed:', error);  // Log error
    });
};

return (
  <div className="login-form-container">
    <div className="login-form">
      <div className="login-logo">
        <img src="https://sunchaser.in/wp-content/uploads/2021/09/Sunchaser-Structure-Logo-2.png" alt="Logo" className="logo" />
      </div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <InputField
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="login-button">Login</button>
      </form>
      {error && <div className="error-message">{error}</div>}
    </div>
  </div>
);

};

export default LoginForm;
