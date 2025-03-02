import React, { useState, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CustomHeader from "./components/CustomHeader/CustomHeader";
import CustomSidebar from "./components/CustomSidebar/CustomSidebar";
import AttendencePage from "./pages/AttendancePage/AttendancePage";
import EmployeePage from "./pages/EmployeePage/EmployeePage";
import SettingsPage from "./pages/SettingPage/SettingPage";
import UploadPage from "./pages/UploadPage/UploadPage";
import UserListPage from "./pages/UserListPage/UserListPage";
import LogInPage from "./pages/LogInPage/LogInPage";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { pageRedirect } from "./utils/constants";
import "./App.css";

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Access the AuthContext here
  const { isAuthenticated, login, logout, user } = useContext(AuthContext);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  console.log('isAuthenticated:', isAuthenticated);
  console.log('user:', user);

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
      <BrowserRouter>
        {isAuthenticated ? (
          <div className="flex">
            <CustomSidebar
              isOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
              isAdmin={user?.role === 'admin'}
              onLogout={logout}
              pagesRedirect={pageRedirect}
            />
            <div className="flex-1">
              <CustomHeader toggleSidebar={toggleSidebar} user={user} />
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AttendencePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/employee"
                  element={
                    <ProtectedRoute>
                      <EmployeePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upload"
                  element={
                    <ProtectedRoute>
                      <UploadPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user-list"
                  element={
                    <ProtectedRoute>
                      <UserListPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        ) : (
          <Routes>
            <Route
              path="/login"
              element={<LogInPage onLogin={login} />}
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </BrowserRouter>
  );
};

export default App;
