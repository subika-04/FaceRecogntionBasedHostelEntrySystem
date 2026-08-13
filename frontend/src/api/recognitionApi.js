import axiosClient from './axiosClient';
import { normalizeRecognitionRecord, normalizeRecognitionRecords } from '../utils/normalizeRecognitionRecord';

// POST /recognition/identify -> { camera, image } -> RecognitionResponse
export const identifyFace = (camera, imageBase64) =>
  axiosClient
    .post('/recognition/identify', { camera, image: imageBase64 })
    .then((res) => res.data);

// GET /recognition/history -> Page<RecognitionHistoryResponse>
// Supported params: studentId, status, camera, triggeredById, page, size, sortBy, sortDir
// Note: backend forces triggeredById = current user for STAFF role regardless
// of what is sent here.
// NOTE: the backend's RecognitionHistoryResponse uses `confidenceScore`, not
// `confidence` -- normalized here so every component downstream can reliably
// read `.confidence` regardless of which endpoint the record came from.
export const getRecognitionHistory = (params) =>
  axiosClient.get('/recognition/history', { params }).then((res) => ({
    ...res.data,
    content: normalizeRecognitionRecords(res.data.content),
  }));

// GET /recognition/history/{id} -> RecognitionHistoryResponse
export const getRecognitionHistoryById = (id) =>
  axiosClient.get(`/recognition/history/${id}`).then((res) => normalizeRecognitionRecord(res.data));
