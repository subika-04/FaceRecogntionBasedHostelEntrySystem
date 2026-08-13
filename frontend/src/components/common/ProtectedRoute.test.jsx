import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../../context/AuthContext');
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

function renderProtected(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a loading spinner while the session is still initializing', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, initializing: true });
    renderProtected();
    expect(screen.getByText('Checking your session…')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, initializing: false });
    renderProtected();
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });

  it('renders the protected content when authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, initializing: false });
    renderProtected();
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });
});
