/**
 * Minimal RFC 4180 CSV parser: handles quoted fields, escaped quotes ("")
 * inside quoted fields, and commas/newlines inside quotes. Good enough for
 * the student-import use case (no external dependency needed for this).
 * Returns { headers: string[], rows: string[][] }.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      pushField();
    } else if (char === '\n') {
      pushRow();
    } else if (char === '\r') {
      // swallow -- \r\n line endings are handled by the following \n
    } else {
      field += char;
    }
  }
  // Final field/row if the text didn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  const nonEmptyRows = rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
  const [headers, ...dataRows] = nonEmptyRows;
  return { headers: headers || [], rows: dataRows };
}

/**
 * Maps parsed CSV rows into plain objects using `headers`, trimming
 * whitespace and normalizing header names to match StudentCreateRequest's
 * field names (registerNumber, fullName, department, year, hostelStatus,
 * phone, email) regardless of exact casing/spacing in the source file.
 */
const HEADER_ALIASES = {
  registernumber: 'registerNumber',
  register_number: 'registerNumber',
  regno: 'registerNumber',
  fullname: 'fullName',
  full_name: 'fullName',
  name: 'fullName',
  department: 'department',
  dept: 'department',
  year: 'year',
  hostelstatus: 'hostelStatus',
  hostel_status: 'hostelStatus',
  status: 'hostelStatus',
  phone: 'phone',
  mobile: 'phone',
  email: 'email',
};

export function rowsToObjects(headers, rows) {
  const normalizedHeaders = headers.map((h) => HEADER_ALIASES[h.trim().toLowerCase().replace(/\s+/g, '')] || h.trim());
  return rows.map((row) => {
    const obj = {};
    normalizedHeaders.forEach((header, i) => {
      obj[header] = (row[i] ?? '').trim();
    });
    return obj;
  });
}
