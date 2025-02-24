import React from 'react';

const InputField = ({ label, type, value, onChange }) => {
  return (
    <div className="input-field">
      <label>{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={onChange} 
        required 
        className="input-field__input"
      />
    </div>
  );
};

export default InputField;
