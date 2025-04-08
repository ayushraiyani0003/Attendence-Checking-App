import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import logo from '../../assets/sunchaser.png'; 
import "./CustomSidebar.css";

export default function CustomSidebar({ isOpen, toggleSidebar, userDepartments, isAdmin, onLogout, pagesRedirect }) {
  // console.log(userDepartments);
  
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
            <h2><img src={logo} alt="Logo" className="sidebar-logo" /></h2>
            <button onClick={toggleSidebar} className="site-close-btn">
              <X size={24} />
            </button>
          </div>
          
          {/* Departments section - Displayed for both user and admin */}
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">Quick Links</h3>
            <ul className="sidebar-list">
                <li className="sidebar-item">
                  <Link to="/" onClick={toggleSidebar}>Attendance</Link>
                </li>
                <li className="sidebar-item">
                  <Link to="/employee-list" onClick={toggleSidebar}>Employee List</Link>
                </li>
            </ul>
          </div>
          
          {/* Admin links section - Only shows if isAdmin is true */}
          {isAdmin && (
            <div className="sidebar-section">
              <h3 className="sidebar-sidebar-section-title">Admin Controls</h3>
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

          {/* Display logout option */}
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">Admin Controls</h3>
            <ul className="sidebar-list">
              <li className="sidebar-item" onClick={onLogout}>
                Logout
              </li>
            </ul>
          </div>

        </motion.div>
      </AnimatePresence>
    </>
  );
}
