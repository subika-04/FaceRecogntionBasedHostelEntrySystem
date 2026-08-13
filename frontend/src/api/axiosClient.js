import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// In-memory access token store. We deliberately do NOT persist the access
// token in localStorage (XSS surface); the httpOnly refresh cookie set by
// POST /auth/login is what survives a page reload, and we exchange it for a
// fresh access token via POST /auth/refresh on app start.
let accessToken = null;
let onUnauthorized = null; // callback injected by AuthContext to force logout

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

const axiosClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // required so the httpOnly refreshToken cookie is sent
});

axiosClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Never try to refresh for the auth endpoints themselves
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axiosClient
            .post('/auth/refresh')
            .then((res) => {
              const newToken = res.data.accessToken;
              setAccessToken(newToken);
              return newToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        if (onUnauthorized) onUnauthorized();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
