import { HOSTEL_STATUS } from './constants';

/**
 * The single source of truth for "is this a valid student record", used by
 * both StudentForm (one row, interactive) and the CSV Import Wizard (many
 * rows, batch). Previously this logic only existed inline inside
 * StudentForm's `validate()` -- extracting it here means the import wizard
 * can't drift out of sync with what the manual form actually requires.
 */
export function validateStudentFields(form) {
  const errors = {};
  if (!form.registerNumber?.trim()) errors.registerNumber = 'Register number is required';
  if (!form.fullName?.trim()) errors.fullName = 'Full name is required';
  if (!form.department?.trim()) errors.department = 'Department is required';

  const yearNum = Number(form.year);
  if (!form.year || Number.isNaN(yearNum) || yearNum < 1 || yearNum > 5) {
    errors.year = 'Year must be between 1 and 5';
  }
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = 'Invalid email format';
  }
  if (form.hostelStatus && !HOSTEL_STATUS.includes(form.hostelStatus)) {
    errors.hostelStatus = `Hostel status must be one of: ${HOSTEL_STATUS.join(', ')}`;
  }
  return errors;
}
