import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './components/ui/Toast';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsListPage from './pages/StudentsListPage';
import StudentCreatePage from './pages/StudentCreatePage';
import StudentDetailPage from './pages/StudentDetailPage';
import RecognitionPage from './pages/RecognitionPage';
import RecognitionHistoryPage from './pages/RecognitionHistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import UserManagementPage from './pages/UserManagementPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import HelpPage from './pages/HelpPage';
import AboutPage from './pages/AboutPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';
import { ROLES } from './utils/constants';

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
        <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Everything below requires a valid session */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index path="/" element={<DashboardPage />} />

              <Route path="/students" element={<StudentsListPage />} />
              <Route path="/students/new" element={<StudentCreatePage />} />
              <Route path="/students/:id" element={<StudentDetailPage />} />

              <Route
                path="/recognition/live"

                element={<RecognitionPage />}
              />
              <Route
                path="/recognition/history"

                element={<RecognitionHistoryPage />}
              />

              <Route path="/profile" element={<ProfilePage />} />
              <Route
                path="/change-password"

                element={<ChangePasswordPage />}
              />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/about" element={<AboutPage />} />

              {/* Admin-only areas, mirroring SecurityConfig's hasRole('ADMIN') rules */}
              <Route element={<RoleRoute allow={[ROLES.ADMIN]} />}>
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/users" element={<UserManagementPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
        </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
