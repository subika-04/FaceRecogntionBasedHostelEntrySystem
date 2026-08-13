import axiosClient from './axiosClient';

// GET /settings -> SystemSettingResponse[] (ADMIN only)
export const getAllSettings = () =>
  axiosClient.get('/settings').then((res) => res.data);

// PUT /settings/{key} -> { value } -> SystemSettingResponse (ADMIN only)
// Known keys from seed data: RECOGNITION_THRESHOLD, JWT_EXPIRATION_MS, CAMERA_SOURCES
export const updateSetting = (key, value) =>
  axiosClient.put(`/settings/${key}`, { value }).then((res) => res.data);
