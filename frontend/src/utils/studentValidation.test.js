import { describe, it, expect } from 'vitest';
import { validateStudentFields } from './studentValidation';

const validForm = {
  registerNumber: 'REG001',
  fullName: 'Jane Doe',
  department: 'CSE',
  year: '2',
  email: 'jane@example.com',
  hostelStatus: 'HOSTELLER',
};

describe('validateStudentFields', () => {
  it('returns no errors for a fully valid form', () => {
    expect(validateStudentFields(validForm)).toEqual({});
  });

  it('requires registerNumber, fullName, and department', () => {
    const errors = validateStudentFields({ ...validForm, registerNumber: '  ', fullName: '', department: undefined });
    expect(errors.registerNumber).toBeTruthy();
    expect(errors.fullName).toBeTruthy();
    expect(errors.department).toBeTruthy();
  });

  it('rejects a year outside 1-5', () => {
    expect(validateStudentFields({ ...validForm, year: '0' }).year).toBeTruthy();
    expect(validateStudentFields({ ...validForm, year: '6' }).year).toBeTruthy();
    expect(validateStudentFields({ ...validForm, year: 'not-a-number' }).year).toBeTruthy();
    expect(validateStudentFields({ ...validForm, year: '' }).year).toBeTruthy();
  });

  it('accepts every year from 1 to 5', () => {
    for (const year of ['1', '2', '3', '4', '5']) {
      expect(validateStudentFields({ ...validForm, year }).year).toBeUndefined();
    }
  });

  it('rejects a malformed email but allows a blank one (email is optional)', () => {
    expect(validateStudentFields({ ...validForm, email: 'not-an-email' }).email).toBeTruthy();
    expect(validateStudentFields({ ...validForm, email: '' }).email).toBeUndefined();
  });

  it('rejects a hostelStatus value outside the known enum, but allows it blank', () => {
    expect(validateStudentFields({ ...validForm, hostelStatus: 'ON_VACATION' }).hostelStatus).toBeTruthy();
    expect(validateStudentFields({ ...validForm, hostelStatus: '' }).hostelStatus).toBeUndefined();
  });
});
