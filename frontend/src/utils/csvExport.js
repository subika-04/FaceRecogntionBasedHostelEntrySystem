/**
 * Quick client-side "export what I'm looking at right now" CSV download.
 * Distinct from the server-generated reports in Reports (which support
 * proper filtering across the *entire* dataset, not just the current page)
 * -- this is for the common case of "I have these 10 rows on screen, give
 * me a CSV of exactly them" without navigating away.
 */
export function downloadCsv(filename, rows, columns) {
  if (!rows || rows.length === 0) return;

  const escape = (value) => {
    const str = value === null || value === undefined ? '' : String(value);
    // Quote any value containing a comma, quote, or newline, doubling
    // internal quotes per RFC 4180.
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const header = columns.map((c) => escape(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escape(typeof c.value === 'function' ? c.value(row) : row[c.value])).join(','))
    .join('\n');

  downloadBlob(filename, header + '\n' + body, 'text/csv;charset=utf-8;');
}

/** Same idea as downloadCsv but for raw JSON -- no column mapping needed,
 *  just the data as-is (or an already-shaped object/array the caller built). */
export function downloadJson(filename, data) {
  if (!data) return;
  downloadBlob(filename, JSON.stringify(data, null, 2), 'application/json;charset=utf-8;');
}

function downloadBlob(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
