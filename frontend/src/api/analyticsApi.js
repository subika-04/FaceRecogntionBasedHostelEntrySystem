import axiosClient from './axiosClient';
import { normalizeRecognitionRecords } from '../utils/normalizeRecognitionRecord';

// All endpoints below require ROLE_ADMIN on the backend (see SecurityConfig
// /analytics/** -> hasRole('ADMIN')).

// GET /analytics/summary -> DashboardSummaryResponse
export const getSummary = () =>
  axiosClient.get('/analytics/summary').then((res) => res.data);

// GET /analytics/trends?range=DAILY|WEEKLY|MONTHLY -> TrendDataPoint[]
export const getTrends = (range = 'DAILY') =>
  axiosClient.get('/analytics/trends', { params: { range } }).then((res) => res.data);

// GET /analytics/peak-hours -> PeakHourResponse[]
export const getPeakHours = () =>
  axiosClient.get('/analytics/peak-hours').then((res) => res.data);

// GET /analytics/cameras?limit=5 -> CameraCountResponse[]
export const getTopCameras = (limit = 5) =>
  axiosClient.get('/analytics/cameras', { params: { limit } }).then((res) => res.data);

// GET /analytics/recent/successful?limit=5 -> RecognitionHistoryResponse[]
// Normalized: see utils/normalizeRecognitionRecord.js -- this endpoint's raw
// response uses `confidenceScore`, not `confidence`.
export const getRecentSuccessful = (limit = 5) =>
  axiosClient
    .get('/analytics/recent/successful', { params: { limit } })
    .then((res) => normalizeRecognitionRecords(res.data));

// GET /analytics/recent/activity?limit=10 -> RecognitionHistoryResponse[]
export const getRecentActivity = (limit = 10) =>
  axiosClient
    .get('/analytics/recent/activity', { params: { limit } })
    .then((res) => normalizeRecognitionRecords(res.data));
