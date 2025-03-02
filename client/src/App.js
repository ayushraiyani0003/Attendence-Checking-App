import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CustomHeader from "./components/CustomHeader/CustomHeader";
import CustomSidebar from "./components/CustomSidebar/CustomSidebar";
import AttendencePage from "./pages/AttendancePage/AttendancePage";
import EmployeePage from "./pages/EmployeePage/EmployeePage";
import SettingsPage from "./pages/SettingPage/SettingPage";
import UploadPage from "./pages/UploadPage/UploadPage";
import UserListPage from "./pages/UserListPage/UserListPage"
import LogInPage from "./pages/LogInPage/LogInPage";
import "./App.css";

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    console.log(isSidebarOpen);
  };
  
  const departments = [
    { id: 1, name: "HR" },
    { id: 2, name: "IT" },
    { id: 3, name: "Sales" },
  ];

  const pagesRedirect = {
    "Employee": "/employee",
    "Settings": "/settings", 
    "Upload": "/upload",
    "UserList": "/user-list",
    "Logout": "/logout",
  }
  
  return (
    <BrowserRouter>
      <div className="flex">
        <CustomSidebar 
          isOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar} 
          departments={departments} 
          isAdmin={isAdmin} 
          pagesRedirect={pagesRedirect}
        />
        <div className="flex-1">
          <CustomHeader toggleSidebar={toggleSidebar} />
          <Routes>
            <Route path="/" element={<AttendencePage />} />
            <Route path="/employee" element={<EmployeePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/user-list" element={<UserListPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;