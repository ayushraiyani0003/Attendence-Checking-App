import React from 'react'

function CustomSidebar({departments}) {
  return (
    <aside className="sidebar">
        <h3>Departments</h3>
        <ul>
          {departments.map((dept) => (
            <li key={dept.id}>{dept.name}</li>
          ))}
        </ul>
      </aside>
  )
}

export default CustomSidebar