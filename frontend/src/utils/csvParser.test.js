import { describe, it, expect } from 'vitest';
import { parseCsv, rowsToObjects } from './csvParser';

describe('parseCsv', () => {
  it('parses a simple header + data rows', () => {
    const result = parseCsv('a,b,c\n1,2,3\n4,5,6\n');
    expect(result.headers).toEqual(['a', 'b', 'c']);
    expect(result.rows).toEqual([['1', '2', '3'], ['4', '5', '6']]);
  });

  it('handles a comma inside a quoted field', () => {
    const result = parseCsv('name,dept\n"Doe, Jane",CSE\n');
    expect(result.rows).toEqual([['Doe, Jane', 'CSE']]);
  });

  it('handles a newline inside a quoted field', () => {
    const result = parseCsv('notes\n"line one\nline two"\n');
    expect(result.rows).toEqual([['line one\nline two']]);
  });

  it('unescapes doubled quotes inside a quoted field', () => {
    const result = parseCsv('quote\n"She said ""hi"""\n');
    expect(result.rows).toEqual([['She said "hi"']]);
  });

  it('handles CRLF line endings the same as LF', () => {
    const result = parseCsv('a,b\r\n1,2\r\n3,4\r\n');
    expect(result.rows).toEqual([['1', '2'], ['3', '4']]);
  });

  it('parses correctly even without a trailing newline on the last row', () => {
    const result = parseCsv('a,b\n1,2');
    expect(result.rows).toEqual([['1', '2']]);
  });

  it('returns empty headers and rows for an empty string', () => {
    const result = parseCsv('');
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it('drops blank lines rather than treating them as empty data rows', () => {
    const result = parseCsv('a,b\n1,2\n\n3,4\n');
    expect(result.rows).toEqual([['1', '2'], ['3', '4']]);
  });
});

describe('rowsToObjects', () => {
  it('maps rows to objects keyed by header', () => {
    const result = rowsToObjects(['registerNumber', 'fullName'], [['REG001', 'Jane Doe']]);
    expect(result).toEqual([{ registerNumber: 'REG001', fullName: 'Jane Doe' }]);
  });

  it('normalizes common header aliases to the canonical field names', () => {
    const headers = ['Reg No', 'Full Name', 'Dept', 'Mobile'];
    const result = rowsToObjects(headers, [['REG001', 'Jane Doe', 'CSE', '9999999999']]);
    expect(result[0]).toEqual({
      registerNumber: 'REG001',
      fullName: 'Jane Doe',
      department: 'CSE',
      phone: '9999999999',
    });
  });

  it('is case- and spacing-insensitive when matching aliases', () => {
    const result = rowsToObjects(['REGISTERNUMBER', 'full_name'], [['REG002', 'John Smith']]);
    expect(result[0]).toEqual({ registerNumber: 'REG002', fullName: 'John Smith' });
  });

  it('trims whitespace from every cell value', () => {
    const result = rowsToObjects(['fullName'], [['  Jane Doe  ']]);
    expect(result[0].fullName).toBe('Jane Doe');
  });

  it('fills a missing trailing cell with an empty string rather than undefined', () => {
    const result = rowsToObjects(['fullName', 'email'], [['Jane Doe']]);
    expect(result[0].email).toBe('');
  });

  it('passes through an unrecognized header name as-is', () => {
    const result = rowsToObjects(['someCustomColumn'], [['value']]);
    expect(result[0]).toEqual({ someCustomColumn: 'value' });
  });
});
