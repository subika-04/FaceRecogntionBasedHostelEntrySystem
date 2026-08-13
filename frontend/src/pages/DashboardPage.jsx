import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import AdminDashboardPage from './AdminDashboardPage';
import StaffDashboardPage from './StaffDashboardPage';

// Single "/" route that renders the correct dashboard for the logged-in
// user's role, so the sidebar/router doesn't need two separate index routes.
export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === ROLES.ADMIN) return <AdminDashboardPage />;
  return <StaffDashboardPage />;
}
