import { describe, it, expect } from 'vitest';
import { normalizeRecognitionRecord, normalizeRecognitionRecords } from './normalizeRecognitionRecord';

describe('normalizeRecognitionRecord', () => {
  it('passes null/undefined through unchanged', () => {
    expect(normalizeRecognitionRecord(null)).toBeNull();
    expect(normalizeRecognitionRecord(undefined)).toBeUndefined();
  });

  it('copies confidenceScore into confidence when confidence is absent (the history-record shape)', () => {
    const record = { id: 1, confidenceScore: 0.92 };
    expect(normalizeRecognitionRecord(record).confidence).toBe(0.92);
  });

  it('leaves an existing confidence value untouched even if confidenceScore is also present (the live-identify shape)', () => {
    const record = { id: 1, confidence: 0.5, confidenceScore: 0.99 };
    expect(normalizeRecognitionRecord(record).confidence).toBe(0.5);
  });

  it('resolves to null when neither field is present, rather than leaving it undefined', () => {
    const record = { id: 1 };
    expect(normalizeRecognitionRecord(record).confidence).toBeNull();
  });

  it('preserves every other field on the record unchanged', () => {
    const record = { id: 1, status: 'MATCHED', confidenceScore: 0.7, recognizedByCamera: 'CAM01' };
    const result = normalizeRecognitionRecord(record);
    expect(result.id).toBe(1);
    expect(result.status).toBe('MATCHED');
    expect(result.recognizedByCamera).toBe('CAM01');
  });

  it('does not mutate the original record object', () => {
    const record = { id: 1, confidenceScore: 0.4 };
    normalizeRecognitionRecord(record);
    expect(record.confidence).toBeUndefined();
  });
});

describe('normalizeRecognitionRecords', () => {
  it('returns an empty array for null/undefined input', () => {
    expect(normalizeRecognitionRecords(null)).toEqual([]);
    expect(normalizeRecognitionRecords(undefined)).toEqual([]);
  });

  it('normalizes every record in the array', () => {
    const records = [{ id: 1, confidenceScore: 0.1 }, { id: 2, confidenceScore: 0.2 }];
    const result = normalizeRecognitionRecords(records);
    expect(result.map((r) => r.confidence)).toEqual([0.1, 0.2]);
  });
});
