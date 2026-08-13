import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../api/authApi');
vi.mock('../api/profileApi');
vi.mock('../api/axiosClient', () => ({
  setAccessToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));

import * as authApi from '../api/authApi';
import * as profileApi from '../api/profileApi';
import { setAccessToken } from '../api/axiosClient';
import { AuthProvider, useAuth } from './AuthContext';

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="initializing">{String(auth.initializing)}</span>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="username">{auth.user?.username || 'none'}</span>
      <span data-testid="authError">{auth.authError || 'none'}</span>
      <button onClick={() => auth.login('jdoe', 'pw').catch(() => {})}>Login</button>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  );
}

describe('useAuth', () => {
  it('throws when used outside an AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });
});

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts initializing, then rehydrates the session when the refresh cookie is valid', async () => {
    authApi.refresh.mockResolvedValue({ accessToken: 'tok' });
    profileApi.getProfile.mockResolvedValue({ id: 1, username: 'jdoe', role: 'STAFF' });

    render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByTestId('initializing')).toHaveTextContent('true');

    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('username')).toHaveTextContent('jdoe');
    expect(setAccessToken).toHaveBeenCalledWith('tok');
  });

  it('ends up logged out when there is no valid refresh cookie', async () => {
    authApi.refresh.mockRejectedValue(new Error('no refresh cookie'));

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(profileApi.getProfile).not.toHaveBeenCalled();
  });

  it('logs in successfully, storing the access token and user', async () => {
    authApi.refresh.mockRejectedValue(new Error('no session'));
    authApi.login.mockResolvedValue({ accessToken: 'tok2', user: { id: 2, username: 'newuser' } });

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));

    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));
    expect(screen.getByTestId('username')).toHaveTextContent('newuser');
  });

  it('surfaces the server error message on a failed login', async () => {
    authApi.refresh.mockRejectedValue(new Error('no session'));
    authApi.login.mockRejectedValue({ response: { data: { message: 'Invalid username, email, or password' } } });

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));

    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(screen.getByTestId('authError')).toHaveTextContent('Invalid username, email, or password'));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('clears the session on logout even if the server call fails', async () => {
    authApi.refresh.mockResolvedValue({ accessToken: 'tok' });
    profileApi.getProfile.mockResolvedValue({ id: 1, username: 'jdoe', role: 'STAFF' });
    authApi.logout.mockRejectedValue(new Error('network error'));

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));

    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));
    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('false'));
  });
});
