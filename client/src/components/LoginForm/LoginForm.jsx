import React, { useState } from 'react';
import eyeShow from "../../assets/eyeshow.svg";
import eyeHide from "../../assets/eyehide.svg";
import './LoginForm.css';

// Updated InputField component with show/hide password functionality
const InputField = ({ label, type, value, onChange, showPasswordToggle = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="input-field">
      <label>{label}</label>
      <div className="input-wrapper">
        <input
          className="input-field__input"
          type={showPasswordToggle && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
        />
        {showPasswordToggle && (
          <button 
            type="button" 
            className="password-toggle-btn" 
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? 
              <img src={eyeHide} alt="Hide password" className="eye-icon" /> : 
              <img src={eyeShow} alt="Show password" className="eye-icon" />
            }
          </button>
        )}
      </div>
    </div>
  );
};

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // console.log('Login attempt with in form username:', username, 'and password:', password);
    onLogin(username, password)
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
            showPasswordToggle={true}
          />
          <button type="submit" className="login-button">Login</button>
        </form>
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default LoginForm;