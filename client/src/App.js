import React, { useState, useEffect, useContext } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
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
import AdminNotificationPanel from "./pages/notificationManagement/notificationManagement";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { pageRedirect } from "./utils/constants";
import { EmployeeProvider } from "./context/EmployeeContext";
import { UploadProvider } from "./context/UploadContext";
import { DashboardProvider } from "./context/DashboardContext";
import { SessionProvider } from "./context/SessionsContext";
import { NotificationProvider } from "./context/notificationContext";
import { AttendanceLogProvider } from "./context/AttendanceLogContext";
import { AttendanceUnlockProvider } from "./context/AttendanceUnlockContext";
import { SettingsProvider } from "./context/SettingsContext";
import ProtectedRoute from "./components/ProtectedRoute";
import WebSocketProvider from "./context/WebSocketContext";
import NetworkMonitor from "./components/NetworkMonitor/NetworkMonitor";
import PopupNotification from "./components/popup/popup";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import AttendanceChangePage from "./pages/AttendanceChangePage/AttendanceChangePage";
import AttendanceUnlockPage from "./pages/AttendanceUnlockPage/AttendanceUnlockPage";

// Create a separate component for the authenticated layout
const AuthenticatedLayout = ({ user }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [selectedMonthYear, setSelectedMonthYear] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("");

    const navigate = useNavigate();
    const { logout } = useContext(AuthContext);

    useEffect(() => {
        // Get the current date
        const now = new Date();
        const dayOfMonth = now.getDate();
        
        // If we're on the 1st day of the month, select the previous month
        // Otherwise, select the current month
        const targetDate = dayOfMonth === 1 
            ? new Date(now.getFullYear(), now.getMonth() - 1, 1) // Previous month if it's the 1st
            : new Date(now.getFullYear(), now.getMonth(), 1);     // Current month otherwise
        
        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        
        const formattedDate = `${months[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
        setSelectedMonthYear(formattedDate);
        // console.log("AuthenticatedLayout: Initial month set to", formattedDate);

        // Initialize selected group with the first available group from user
        if (user && user.userReportingGroup) {
            if (
                Array.isArray(user.userReportingGroup) &&
                user.userReportingGroup.length > 0
            ) {
                setSelectedGroup(user.userReportingGroup[0]);
            } else if (typeof user.userReportingGroup === "string") {
                setSelectedGroup(user.userReportingGroup);
            }
        }
    }, [user]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleSearchChange = (searchText) => {
        setSearchText(searchText);
    };

    const handleMonthChange = (monthYear) => {
        // console.log("AuthenticatedLayout: Month changed to", monthYear);
        setSelectedMonthYear(monthYear);
        
        // Dispatch a custom event to ensure all components are aware of the change
        const event = new CustomEvent('monthYearChanged', { 
            detail: { monthYear } 
        });
        window.dispatchEvent(event);
    };

    const handleGroupChange = (group) => {
        setSelectedGroup(group);
        // console.log("Selected group changed to:", group);
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
                        onGroupChange={handleGroupChange}
                    />

                    <Routes>
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute isAuthenticated={true}>
                                    <EmployeeProvider
                                        userRole={user.role}
                                        userReportingGroup={
                                            user.userReportingGroup
                                        }
                                    >
                                        <WebSocketProvider>
                                            <AttendencePage
                                                user={user}
                                                monthYear={selectedMonthYear}
                                                selectedGroup={selectedGroup}
                                                setSelectedGroup={handleGroupChange}
                                            />
                                        </WebSocketProvider>
                                    </EmployeeProvider>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <DashboardProvider>
                                    <MistakeDashboard
                                        selectedMonthYear={selectedMonthYear}
                                    />
                                </DashboardProvider>
                            }
                        />
                        <Route
                            path="/employee"
                            element={
                                <SettingsProvider>
                                    <EmployeeProvider
                                        userRole={user.role}
                                        userReportingGroup={
                                            user.userReportingGroup
                                        }
                                    >
                                        <EmployeePage />
                                    </EmployeeProvider>
                                </SettingsProvider>
                            }
                        />
                        <Route path="/user-list" element={<UserListPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
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
                                <EmployeeProvider
                                    userRole={user.role}
                                    userReportingGroup={user.userReportingGroup}
                                >
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
                            element={<AdminNotificationPanel />}
                        />
                        <Route
                            path="/request-edit"
                            element={
                                <AttendanceUnlockProvider>
                                    <AttendanceUnlockPage
                                        monthYearString={selectedMonthYear}
                                        user={user}
                                    />
                                </AttendanceUnlockProvider>
                            }
                        />
                        <Route
                            path="/logs"
                            element={
                                <AttendanceLogProvider>
                                    <AttendanceChangePage />
                                </AttendanceLogProvider>
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
    const { isAuthenticated, user, login, forceLogin } = useContext(AuthContext);

    return (
        <>
            {isAuthenticated ? (
                <AuthenticatedLayout user={user} />
            ) : (
                <Routes>
                    <Route
                        path="/login"
                        element={<LogInPage onLogin={login} onForceLogin={forceLogin} />}
                    />
                    <Route
                        path="*"
                        element={<Navigate to="/login" replace />}
                    />
                </Routes>
            )}
        </>
    );
};

export default App;