import React, { useState, useContext, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
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
import { EmployeeProvider } from "./context/EmployeeContext";
import { UploadProvider } from "./context/UploadContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { WebSocketProvider } from "./context/WebSocketContext";
import "./App.css";

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, login, logout, user } = useContext(AuthContext);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

    // Handle logout properly
    const handleLogout = () => {
      logout();
      navigate('/login'); // Force navigation to login page
    };

  // Redirection logic after login based on the intended destination
  useEffect(() => {
    if (isAuthenticated && user) {
      // Only redirect if the current path is not the default one after login
      const currentPath = window.location.pathname;

      if (currentPath === "/" || currentPath === "/login") {
        // Redirect to the appropriate dashboard after login
        if (user.role === "admin") {
          navigate("/");
        } else {
          navigate("/");
        }
      }
    }
  }, [isAuthenticated, user, navigate]);

  // console.log(user);
  
  return (
    <AuthProvider>
      {isAuthenticated ? (
        <div className="flex">
            <CustomSidebar
              isOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
              isAdmin={user?.role === "admin"}
              userDepartments={user.userReportingGroup}
              onLogout={handleLogout}
              pagesRedirect={pageRedirect}
            />

          <div className="flex-1">
            <CustomHeader toggleSidebar={toggleSidebar} user={user} />
            <Routes>
              {/* Default page after login (either user or admin based) */}
              <Route
                path="/"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <WebSocketProvider>
                    <AttendencePage user={user} />
                    </WebSocketProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <EmployeeProvider>
                      <EmployeePage />
                    </EmployeeProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user-list"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <UserListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <UploadProvider>
                      <UploadPage />
                    </UploadProvider>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<LogInPage onLogin={login} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </AuthProvider>
  );
};

export default App;
