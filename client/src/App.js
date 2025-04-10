import React, { useState, useEffect, useContext } from "react";
import {
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
import MistakeDashboard from "./pages/DashboardPage/DashboardPage";
import EmployeeOrderPage from "./pages/employeeOrderPage/EmployeeOrderPage";
import SessionManagement from "./pages/sessionManagment/SessionManagement";
import LogInPage from "./pages/LogInPage/LogInPage";
import AdminNotificationPanel from "./pages/notificationManagement/notificationManagement"
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { pageRedirect } from "./utils/constants";
import { EmployeeProvider } from "./context/EmployeeContext";
import { UploadProvider } from "./context/UploadContext";
import { DashboardProvider } from "./context/DashboardContext";
import { SessionProvider } from "./context/SessionsContext";
import { NotificationProvider } from "./context/notificationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import WebSocketProvider from "./context/WebSocketContext";
import NetworkMonitor from "./components/NetworkMonitor/NetworkMonitor";
import PopupNotification from './components/popup/popup';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./App.css";

// Create a separate component for the authenticated layout
const AuthenticatedLayout = ({ user }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedMonthYear, setSelectedMonthYear] = useState("");
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const currentDate = new Date();
    const options = { year: "numeric", month: "short" };
    const formattedDate = currentDate.toLocaleDateString("en-US", options);
    setSelectedMonthYear(formattedDate);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearchChange = (searchText) => {
    setSearchText(searchText);
  };

  const handleMonthChange = (monthYear) => {
    setSelectedMonthYear(monthYear);
  };

  // Handle logout properly
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <NotificationProvider>
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
          {/* PopupNotification added outside of other content to properly overlay */}
          <PopupNotification />
          
          <CustomHeader
            toggleSidebar={toggleSidebar}
            user={user}
            onSearch={handleSearchChange}
            onMonthChange={handleMonthChange}
          />
          
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute isAuthenticated={true}>
                  <WebSocketProvider>
                    <AttendencePage user={user} monthYear={selectedMonthYear} />
                  </WebSocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <DashboardProvider>
                  <MistakeDashboard selectedMonthYear={selectedMonthYear} />
                </DashboardProvider>
              }
            />
            <Route
              path="/employee"
              element={
                <EmployeeProvider userRole={user.userRole} userReportingGroup={user.userReportingGroup}>
                  <EmployeePage />
                </EmployeeProvider>
              }
            />
            <Route
              path="/user-list"
              element={<UserListPage />}
            />
            <Route
              path="/settings"
              element={<SettingsPage />}
            />
            <Route
              path="/upload"
              element={
                <UploadProvider>
                  <UploadPage />
                </UploadProvider>
              }
            />
            <Route
              path="/employee-list"
              element={
                <EmployeeProvider userRole={user.userRole} userReportingGroup={user.userReportingGroup}>
                  <EmployeeOrderPage user={user} />
                </EmployeeProvider>
              }
            />
            <Route
              path="/sessions"
              element={
                <SessionProvider>
                  <SessionManagement />
                </SessionProvider>
              }
            />
            <Route
              path="/make-notification"
              element={
                <AdminNotificationPanel />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </NotificationProvider>
  );
};

// Main App component
const App = () => {
  return (
    <AuthProvider>
      <>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <NetworkMonitor />

        <AppContent />
      </>
    </AuthProvider>
  );
};

// Content component that uses AuthContext
const AppContent = () => {
  const { isAuthenticated, user, login } = useContext(AuthContext);

  return (
    <>
      {isAuthenticated ? (
        <AuthenticatedLayout user={user} />
      ) : (
        <Routes>
          <Route path="/login" element={<LogInPage onLogin={login} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </>
  );
};

export default App;