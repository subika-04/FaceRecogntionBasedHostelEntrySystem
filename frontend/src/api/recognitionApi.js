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

// GET /recognition/images/{filename} -> binary JPEG (requires auth header,
// same reasoning as fetchStudentImageBlobUrl in studentApi.js: a plain
// <img src="..."> can't attach the Authorization header, so the bytes are
// fetched via axios and rendered as an object URL instead).
// capturedImageUrl looks like "/recognition/images/unrecognized_<uuid>.jpg".
export const fetchCapturedFaceImageBlobUrl = async (capturedImageUrl) => {
  if (!capturedImageUrl) return null;
  const relativePath = capturedImageUrl.replace(/^\/recognition/, '');
  const res = await axiosClient.get(`/recognition${relativePath}`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(res.data);
};

// Downloads the captured face image straight to the user's device via a
// temporary <a download> click, using the backend's Content-Disposition:
// attachment response (?download=true) rather than just opening the blob,
// so staff get a real save-to-disk prompt instead of a new tab.
export const downloadCapturedFaceImage = async (capturedImageUrl, suggestedFilename) => {
  if (!capturedImageUrl) return;
  const relativePath = capturedImageUrl.replace(/^\/recognition/, '');
  const res = await axiosClient.get(`/recognition${relativePath}`, {
    params: { download: true },
    responseType: 'blob',
  });
  const objectUrl = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = suggestedFilename || capturedImageUrl.split('/').pop() || 'unrecognized-face.jpg';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};
