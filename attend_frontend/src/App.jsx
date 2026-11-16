import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/login";
import ChangePasswordPage from "@/pages/change-password";
import MyAttendancePage from "@/pages/my-attendance";
import DashboardPage from "@/pages/admin/Dashboard";
import AttendancePage from "@/pages/admin/Attendance";
import UsersPage from "@/pages/admin/Users";
import HolidaysPage from "@/pages/admin/Holidays";
import SettingsPage from "@/pages/admin/Settings";

const HomeRedirect = () => {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? "/admin" : "/my-attendance"} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute role="employee" />}>
            <Route element={<AppLayout />}>
              <Route path="/my-attendance" element={<MyAttendancePage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute role="super_admin" />}>
            <Route element={<AppLayout />}>
              <Route path="/admin" element={<DashboardPage />} />
              <Route path="/admin/attendance" element={<AttendancePage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/holidays" element={<HolidaysPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
