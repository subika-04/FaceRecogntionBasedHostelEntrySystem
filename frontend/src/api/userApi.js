import axiosClient from './axiosClient';

// GET /users?query=&role=&status=&page=&size=&sortBy=&sortDir= -> Page<UserResponse>
export const searchUsers = (params) =>
  axiosClient.get('/users', { params }).then((res) => res.data);

// GET /users/{id} -> UserResponse
export const getUserById = (id) => axiosClient.get(`/users/${id}`).then((res) => res.data);

// POST /users -> UserCreateRequest -> UserResponse (201)
export const createUser = (payload) =>
  axiosClient.post('/users', payload).then((res) => res.data);

// PUT /users/{id} -> UserUpdateRequest -> UserResponse
export const updateUser = (id, payload) =>
  axiosClient.put(`/users/${id}`, payload).then((res) => res.data);

// PUT /users/{id}/role -> { role } -> UserResponse
export const updateUserRole = (id, role) =>
  axiosClient.put(`/users/${id}/role`, { role }).then((res) => res.data);

// POST /users/{id}/deactivate -> UserResponse
export const deactivateUser = (id) =>
  axiosClient.post(`/users/${id}/deactivate`).then((res) => res.data);

// POST /users/{id}/activate -> UserResponse
export const activateUser = (id) =>
  axiosClient.post(`/users/${id}/activate`).then((res) => res.data);

// POST /users/{id}/reset-password -> { newPassword } -> { message }
export const resetUserPassword = (id, newPassword) =>
  axiosClient.post(`/users/${id}/reset-password`, { newPassword }).then((res) => res.data);
