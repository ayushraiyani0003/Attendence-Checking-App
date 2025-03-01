import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom"; // Added import for Link
import "./CustomSidebar.css";

export default function CustomSidebar({ isOpen, toggleSidebar, departments, isAdmin, pagesRedirect }) {
  return (
    <>
      {/* Background overlay when sidebar is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Animated sidebar */}
      <AnimatePresence>
        <motion.div
          className="sidebar"
          initial={{ x: "-100%" }}
          animate={{ x: isOpen ? "0%" : "-100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
        >
          <div className="sidebar-header">
            <h2>Departments</h2>
            <button onClick={toggleSidebar} className="close-btn">
              <X size={24} />
            </button>
          </div>
          
          {/* Departments section */}
          <div className="sidebar-section">
            <h3 className="section-title">Departments</h3>
            <ul className="sidebar-list">
      {/* if isAdmin is true, show only one Attendance page, otherwise show all */}
{isAdmin ? (
    <li className="sidebar-item">
        <Link to="/" onClick={toggleSidebar}>Attendance</Link>
    </li>
) : (
    departments.map((dept) => (
        <li 
            key={dept.id} 
            className="sidebar-item"
            onClick={toggleSidebar}
        >
            {dept.name}
        </li>
    ))
)}

            </ul>
          </div>
          
          {/* Admin links section - only shows if isAdmin is true */}
          {isAdmin && (
            <div className="sidebar-section">
              <h3 className="section-title">Admin Controls</h3>
              <ul className="sidebar-list">
                {Object.keys(pagesRedirect).map((page) => (
                  <li key={page} className="sidebar-item">
                    <Link to={pagesRedirect[page]} onClick={toggleSidebar}>
                      {page}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}