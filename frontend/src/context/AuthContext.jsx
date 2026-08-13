import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/authApi';
import { setAccessToken, setUnauthorizedHandler } from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authErrorCode, setAuthErrorCode] = useState(null);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  // Called by axiosClient whenever a silent refresh fails (refresh cookie
  // missing/expired/invalid) so the app returns to a logged-out state.
  useEffect(() => {
    setUnauthorizedHandler(() => clearSession());
  }, [clearSession]);

  // On first load, try to exchange the httpOnly refresh cookie (if any) for
  // a fresh access token so a page refresh doesn't force a re-login. The
  // backend's /auth/refresh only returns a new access token, not the user
  // profile, so we follow up with GET /profile to rehydrate the user object.
  useEffect(() => {
    (async () => {
      try {
        const { accessToken } = await authApi.refresh();
        setAccessToken(accessToken);
        const profileApi = await import('../api/profileApi');
        const profile = await profileApi.getProfile();
        setUser(profile);
      } catch {
        clearSession();
      } finally {
        setInitializing(false);
      }
    })();
  }, [clearSession]);

  const login = useCallback(async (username, password) => {
    setAuthError(null);
    setAuthErrorCode(null);
    try {
      const data = await authApi.login(username, password);
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message =
        err.response?.data?.message || 'Invalid username, email, or password';
      setAuthError(message);
      setAuthErrorCode(err.response?.data?.errorCode || null);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the server call fails, drop the local session.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const refreshProfile = useCallback(async () => {
    const profileApi = await import('../api/profileApi');
    const profile = await profileApi.getProfile();
    setUser(profile);
    return profile;
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    initializing,
    authError,
    authErrorCode,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
