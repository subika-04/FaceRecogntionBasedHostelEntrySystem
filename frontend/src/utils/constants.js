// Mirrors backend enums exactly (see entity package in the backend ZIP).

export const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
};

export const HOSTEL_STATUS = ['HOSTELLER', 'DAY_SCHOLAR'];

export const ENROLLMENT_STATUS = ['PENDING', 'ENROLLED', 'FAILED'];

export const RECOGNITION_STATUS = ['MATCHED', 'UNKNOWN', 'LOW_CONFIDENCE'];

// Order matters: this is the exact sequence the backend requires all 5
// pose frames to be captured in before /enrollment/complete will succeed.
export const POSES = ['STRAIGHT', 'LEFT', 'RIGHT', 'UP', 'DOWN'];

export const TREND_RANGES = ['DAILY', 'WEEKLY', 'MONTHLY'];

// Seeded in db/sample_data.sql as the CAMERA_SOURCES system setting. Editable
// by an admin from the Settings page; used here only as a client-side
// fallback if that setting hasn't loaded yet.
export const DEFAULT_CAMERA_SOURCES = [
  { id: 'CAM01', label: 'Main Gate Entrance' },
  { id: 'CAM02', label: 'Hostel Exit' },
];

export const SETTING_KEYS = {
  RECOGNITION_THRESHOLD: 'RECOGNITION_THRESHOLD',
  JWT_EXPIRATION_MS: 'JWT_EXPIRATION_MS',
  CAMERA_SOURCES: 'CAMERA_SOURCES',
};
