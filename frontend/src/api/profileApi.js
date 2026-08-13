import axiosClient from './axiosClient';

// GET /profile -> UserResponse
export const getProfile = () => axiosClient.get('/profile').then((res) => res.data);

// PUT /profile -> { fullName, email, phone, avatarUrl } -> UserResponse
export const updateProfile = (payload) =>
  axiosClient.put('/profile', payload).then((res) => res.data);
