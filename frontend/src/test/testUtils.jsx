import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

/**
 * Renders a component inside a MemoryRouter. Use this instead of a bare
 * `render()` for anything that calls useNavigate/useLocation/useParams or
 * renders a <Link>/<Navigate> -- which is most pages and several shared
 * components (LoginPage, ProtectedRoute, RoleRoute, Sidebar links, etc).
 *
 * `route`: initial path (default '/').
 * `path`: route pattern to register the ui under, only needed when the
 *   component reads route params via useParams().
 */
export function renderWithRouter(ui, { route = '/', path } = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    ),
  });
}

/**
 * Base shape for a mocked `useAuth()` return value. Individual tests spread
 * this and override only what that test cares about, instead of each
 * re-declaring every field useAuth exposes (which drifts out of sync with
 * AuthContext.jsx as it grows).
 */
export function mockAuthValue(overrides = {}) {
  return {
    user: null,
    isAuthenticated: false,
    initializing: false,
    authError: null,
    authErrorCode: null,
    login: async () => {},
    logout: async () => {},
    refreshProfile: async () => {},
    ...overrides,
  };
}

export function mockAdminUser(overrides = {}) {
  return { id: 1, username: 'admin', fullName: 'Admin User', role: 'ADMIN', ...overrides };
}

export function mockStaffUser(overrides = {}) {
  return { id: 2, username: 'staff', fullName: 'Staff User', role: 'STAFF', ...overrides };
}
