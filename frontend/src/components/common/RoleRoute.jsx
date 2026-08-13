import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Wrap admin-only routes with <RoleRoute allow={['ADMIN']} />. Mirrors the
// backend's SecurityConfig rules (/analytics/**, /settings/**, /reports/**
// all require hasRole('ADMIN')).
export default function RoleRoute({ allow }) {
  const { user } = useAuth();

  if (!user || !allow.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
