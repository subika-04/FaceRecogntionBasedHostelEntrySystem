import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter, mockAuthValue } from '../test/testUtils';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../context/AuthContext');
import { useAuth } from '../context/AuthContext';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders username and password fields and a sign-in button', () => {
    useAuth.mockReturnValue(mockAuthValue());
    renderWithRouter(<LoginPage />);
    expect(screen.getByLabelText('Username or email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('does not render an error alert when there is no auth error', () => {
    useAuth.mockReturnValue(mockAuthValue());
    renderWithRouter(<LoginPage />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('displays the auth error message from context as an alert', () => {
    useAuth.mockReturnValue(mockAuthValue({ authError: 'Invalid username, email, or password' }));
    renderWithRouter(<LoginPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid username, email, or password');
  });

  it('calls login with the entered credentials and navigates home on success', async () => {
    const login = vi.fn().mockResolvedValue({ id: 1 });
    useAuth.mockReturnValue(mockAuthValue({ login }));
    renderWithRouter(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Username or email'), 'jdoe');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(login).toHaveBeenCalledWith('jdoe', 'secret123');
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true }));
  });

  it('navigates back to the originally-requested page after login, not always home', async () => {
    const login = vi.fn().mockResolvedValue({ id: 1 });
    useAuth.mockReturnValue(mockAuthValue({ login }));
    renderWithRouter(<LoginPage />, {
      route: { pathname: '/login', state: { from: { pathname: '/settings' } } },
    });

    await userEvent.type(screen.getByLabelText('Username or email'), 'jdoe');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/settings', { replace: true }));
  });

  it('does not navigate when login rejects', async () => {
    const login = vi.fn().mockRejectedValue(new Error('bad credentials'));
    useAuth.mockReturnValue(mockAuthValue({ login }));
    renderWithRouter(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Username or email'), 'jdoe');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(login).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows a loading state on the submit button while the login request is in flight', async () => {
    let resolveLogin;
    const login = vi.fn(() => new Promise((resolve) => { resolveLogin = resolve; }));
    useAuth.mockReturnValue(mockAuthValue({ login }));
    renderWithRouter(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Username or email'), 'jdoe');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
    resolveLogin({ id: 1 });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sign in' })).not.toBeDisabled());
  });
});
