import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../../context/AuthContext');
import { useAuth } from '../../context/AuthContext';
import RoleRoute from './RoleRoute';

function renderRoleRoute(allow) {
  return render(
    <MemoryRouter initialEntries={['/analytics']}>
      <Routes>
        <Route path="/unauthorized" element={<div>Unauthorized page</div>} />
        <Route element={<RoleRoute allow={allow} />}>
          <Route path="/analytics" element={<div>Analytics content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('RoleRoute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the nested route when the user has an allowed role', () => {
    useAuth.mockReturnValue({ user: { role: 'ADMIN' } });
    renderRoleRoute(['ADMIN']);
    expect(screen.getByText('Analytics content')).toBeInTheDocument();
  });

  it('redirects to /unauthorized when the user role is not in the allow list', () => {
    useAuth.mockReturnValue({ user: { role: 'STAFF' } });
    renderRoleRoute(['ADMIN']);
    expect(screen.getByText('Unauthorized page')).toBeInTheDocument();
    expect(screen.queryByText('Analytics content')).not.toBeInTheDocument();
  });

  it('redirects to /unauthorized when there is no user at all', () => {
    useAuth.mockReturnValue({ user: null });
    renderRoleRoute(['ADMIN']);
    expect(screen.getByText('Unauthorized page')).toBeInTheDocument();
  });
});
