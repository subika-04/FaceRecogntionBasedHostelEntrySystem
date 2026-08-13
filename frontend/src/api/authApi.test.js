import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./axiosClient', () => ({
  default: {
    post: vi.fn(),
  },
}));

import axiosClient from './axiosClient';
import { login, refresh, logout, changePassword } from './authApi';

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login posts credentials to /auth/login and returns the response data', async () => {
    axiosClient.post.mockResolvedValue({ data: { accessToken: 'tok', user: { id: 1 } } });
    const result = await login('jdoe', 'pw123');
    expect(axiosClient.post).toHaveBeenCalledWith('/auth/login', { username: 'jdoe', password: 'pw123' });
    expect(result).toEqual({ accessToken: 'tok', user: { id: 1 } });
  });

  it('login propagates a rejection (e.g. 401) rather than swallowing it', async () => {
    axiosClient.post.mockRejectedValue({ response: { status: 401, data: { message: 'Bad credentials' } } });
    await expect(login('jdoe', 'wrong')).rejects.toMatchObject({ response: { status: 401 } });
  });

  it('refresh posts to /auth/refresh with no body', async () => {
    axiosClient.post.mockResolvedValue({ data: { accessToken: 'new-tok' } });
    const result = await refresh();
    expect(axiosClient.post).toHaveBeenCalledWith('/auth/refresh');
    expect(result).toEqual({ accessToken: 'new-tok' });
  });

  it('logout posts to /auth/logout', async () => {
    axiosClient.post.mockResolvedValue({ data: {} });
    await logout();
    expect(axiosClient.post).toHaveBeenCalledWith('/auth/logout');
  });

  it('changePassword posts old and new password to /auth/change-password', async () => {
    axiosClient.post.mockResolvedValue({ data: {} });
    await changePassword('old', 'new');
    expect(axiosClient.post).toHaveBeenCalledWith('/auth/change-password', {
      oldPassword: 'old',
      newPassword: 'new',
    });
  });
});
