import React, { useState } from 'react';
import InputField from '../InputField/InputField';
import './LoginForm.css';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Username:', username);
    console.log('Password:', password);
    // Handle authentication logic here
  };

  return (
    <div className="login-form-container">
      <div className="login-form">
        <div className="login-logo">
          <img src="https://sunchaser.in/wp-content/uploads/2021/09/Sunchaser-Structure-Logo-2.png" alt="Logo" className="logo" />
          {/* <img src="https://i.pinimg.com/736x/f2/77/2d/f2772d96aace5a005fb7260766dc097d.jpg" alt="Logo" className="logo" /> */}
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
      </div>
    </div>
  );
};

export default LoginForm;
