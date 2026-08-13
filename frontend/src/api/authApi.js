import axiosClient from './axiosClient';

// POST /auth/login -> { accessToken, expiresIn, user } + sets httpOnly refreshToken cookie
export const login = (username, password) =>
  axiosClient.post('/auth/login', { username, password }).then((res) => res.data);

// POST /auth/refresh -> { accessToken, expiresIn } using the httpOnly refresh cookie
export const refresh = () => axiosClient.post('/auth/refresh').then((res) => res.data);

// POST /auth/logout -> clears the refresh cookie server-side
export const logout = () => axiosClient.post('/auth/logout').then((res) => res.data);

// POST /auth/change-password -> { oldPassword, newPassword }
export const changePassword = (oldPassword, newPassword) =>
  axiosClient
    .post('/auth/change-password', { oldPassword, newPassword })
    .then((res) => res.data);
