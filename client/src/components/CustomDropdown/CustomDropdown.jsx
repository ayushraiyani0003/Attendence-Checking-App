import React from 'react'
import Select from 'react-select'
import "./CustomDropdown.css"

function CustomDropdown({ monthOptions, setSelectedMonth, onProcess }) {
  return (
    <div className="dropdown-container">
      <Select
        options={monthOptions}
        placeholder="Select Month & Year"
        onChange={(option) => setSelectedMonth(option)}
        classNamePrefix="react-select"
      />
      <button className="btn-process" onClick={onProcess}>
        Process Data
      </button>
    </div>
  )
}

export default CustomDropdown
