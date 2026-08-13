import axiosClient from './axiosClient';

// POST /students -> StudentCreateRequest -> StudentResponse (201)
export const createStudent = (payload) =>
  axiosClient.post('/students', payload).then((res) => res.data);

// GET /students?query=&page=&size=&sortBy=&sortDir= -> Page<StudentResponse>
export const searchStudents = (params) =>
  axiosClient.get('/students', { params }).then((res) => res.data);

// GET /students/{id} -> StudentResponse
export const getStudentById = (id) =>
  axiosClient.get(`/students/${id}`).then((res) => res.data);

// PUT /students/{id} -> StudentCreateRequest -> StudentResponse
export const updateStudent = (id, payload) =>
  axiosClient.put(`/students/${id}`, payload).then((res) => res.data);

// DELETE /students/{id} -> 204 (ADMIN only)
export const deleteStudent = (id) => axiosClient.delete(`/students/${id}`);

// POST /students/{id}/enrollment/frame -> { pose, image } -> FaceFrameResponse
export const uploadEnrollmentFrame = (id, pose, imageBase64) =>
  axiosClient
    .post(`/students/${id}/enrollment/frame`, { pose, image: imageBase64 })
    .then((res) => res.data);

// POST /students/{id}/enrollment/complete -> StudentResponse
export const completeEnrollment = (id) =>
  axiosClient.post(`/students/${id}/enrollment/complete`).then((res) => res.data);

// GET /students/images/{filename} -> binary JPEG (requires auth header, so we
// fetch as a blob rather than using a plain <img src> which cannot attach
// the Authorization header).
export const fetchStudentImageBlobUrl = async (profileImageUrl) => {
  if (!profileImageUrl || profileImageUrl === 'PENDING') return null;
  // profileImageUrl looks like "/students/images/student_1.jpg"
  const relativePath = profileImageUrl.replace(/^\/students/, '');
  const res = await axiosClient.get(`/students${relativePath}`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(res.data);
};
