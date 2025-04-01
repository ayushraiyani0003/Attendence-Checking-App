import React, { useState } from 'react';

const ColumnVisibilityControl = ({ columns, onToggleColumn }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="column-visibility-control">
      <button onClick={() => setIsOpen(!isOpen)}>
        Columns ▼
      </button>
      
      {isOpen && (
        <div className="column-dropdown">
          {columns.map((column) => (
            <label key={column.id} className="column-option">
              <input
                type="checkbox"
                checked={column.isVisible}
                onChange={() => onToggleColumn(column.id)}
              />
              {column.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColumnVisibilityControl;