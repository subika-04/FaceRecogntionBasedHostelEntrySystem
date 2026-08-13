import { useRef, useState } from 'react';
import * as studentApi from '../../api/studentApi';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { parseCsv, rowsToObjects } from '../../utils/csvParser';
import { validateStudentFields } from '../../utils/studentValidation';
import { downloadCsv } from '../../utils/csvExport';
import { HOSTEL_STATUS } from '../../utils/constants';

const REQUIRED_HEADERS = ['registerNumber', 'fullName', 'department', 'year'];
const TEMPLATE_CSV =
  'registerNumber,fullName,department,year,hostelStatus,phone,email\n' +
  'CS2024001,Jane Doe,Computer Science,2,HOSTELLER,9876543210,jane@example.com\n';

const STEPS = ['Upload', 'Preview', 'Import', 'Summary'];

// open, onClose, onImported: (importedCount) => void, onImportStart: () => void,
// onImportFinished: ({ successCount, duplicateCount, failedCount, cancelled }) => void
export default function StudentCsvImportWizard({ open, onClose, onImported, onImportStart, onImportFinished }) {
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(0);
  const [parseError, setParseError] = useState(null);
  const [rows, setRows] = useState([]); // [{ data, errors, isDuplicateInFile }]
  const [importing, setImporting] = useState(false);
  const [importIndex, setImportIndex] = useState(0);
  const [results, setResults] = useState([]); // [{ row, status: 'success'|'failed'|'duplicate', message }]
  const cancelRef = useRef(false);

  const reset = () => {
    setStep(0);
    setParseError(null);
    setRows([]);
    setImporting(false);
    setImportIndex(0);
    setResults([]);
    cancelRef.current = false;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const processCsvText = (text) => {
    setParseError(null);
    try {
      const { headers, rows: rawRows } = parseCsv(text);
      const missing = REQUIRED_HEADERS.filter(
        (h) => !headers.some((header) => header.trim().toLowerCase().replace(/\s+/g, '') === h.toLowerCase())
      );
      if (rawRows.length === 0) {
        setParseError('The file has no data rows.');
        return;
      }

      const objects = rowsToObjects(headers, rawRows);
      const seenRegisterNumbers = new Set();

      const validated = objects.map((data) => {
        const errors = validateStudentFields(data);
        const regNo = data.registerNumber?.trim();
        const isDuplicateInFile = !!regNo && seenRegisterNumbers.has(regNo);
        if (regNo) seenRegisterNumbers.add(regNo);
        if (isDuplicateInFile) errors.registerNumber = 'Duplicate register number within this file';
        return { data, errors, isDuplicateInFile };
      });

      if (missing.length > 0) {
        setParseError(`Missing required column(s): ${missing.join(', ')}. Use the template below for the expected format.`);
      }
      setRows(validated);
      setStep(1);
    } catch {
      setParseError('Could not parse this file as CSV. Please check the format and try again.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => processCsvText(String(reader.result));
    reader.onerror = () => setParseError('Failed to read the selected file.');
    reader.readAsText(file);
  };

  const validRows = rows.filter((r) => Object.keys(r.errors).length === 0);
  const invalidRows = rows.filter((r) => Object.keys(r.errors).length > 0);

  const startImport = async () => {
    setImporting(true);
    setStep(2);
    cancelRef.current = false;
    onImportStart?.();
    const importResults = [];

    for (let i = 0; i < validRows.length; i++) {
      if (cancelRef.current) break;
      setImportIndex(i + 1);
      const row = validRows[i];
      try {
        await studentApi.createStudent({
          ...row.data,
          year: Number(row.data.year),
          hostelStatus: HOSTEL_STATUS.includes(row.data.hostelStatus) ? row.data.hostelStatus : 'HOSTELLER',
        });
        importResults.push({ row: row.data, status: 'success' });
      } catch (err) {
        const status = err.response?.status;
        importResults.push({
          row: row.data,
          status: status === 409 ? 'duplicate' : 'failed',
          message: err.response?.data?.message || 'Import failed for this row.',
        });
      }
    }

    const wasCancelled = cancelRef.current;
    setResults(importResults);
    setImporting(false);
    setStep(3);

    const successCount = importResults.filter((r) => r.status === 'success').length;
    const duplicateCount = importResults.filter((r) => r.status === 'duplicate').length;
    const failedCount = importResults.filter((r) => r.status === 'failed').length;
    onImportFinished?.({ successCount, duplicateCount, failedCount, cancelled: wasCancelled });
  };

  const successCount = results.filter((r) => r.status === 'success').length;
  const duplicateCount = results.filter((r) => r.status === 'duplicate').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;

  const handleDownloadFailures = () => {
    const failures = results.filter((r) => r.status !== 'success');
    downloadCsv(
      'student-import-failures.csv',
      failures,
      [
        { label: 'Register Number', value: (r) => r.row.registerNumber },
        { label: 'Full Name', value: (r) => r.row.fullName },
        { label: 'Reason', value: (r) => (r.status === 'duplicate' ? 'Register number already exists' : r.message) },
      ]
    );
  };

  const handleFinish = () => {
    if (successCount > 0) onImported(successCount);
    handleClose();
  };

  return (
    <Modal open={open} title="Import Students from CSV" onClose={handleClose} widthClassName="max-w-2xl">
      {/* Step indicator */}
      <ol className="mb-4 flex items-center gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li key={label} className={`flex items-center gap-1 ${i <= step ? 'text-brass-600 font-medium' : 'text-slate-400'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full ${i <= step ? 'bg-brass-100' : 'bg-slate-100 dark:bg-slate-700'}`}>
              {i + 1}
            </span>
            {label}
            {i < STEPS.length - 1 && <span className="mx-1 text-slate-300">→</span>}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Upload a CSV file with one row per student. Required columns: register number, full name, department, year.
          </p>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} className="input" />
          {parseError && (
            <div role="alert" className="rounded-lg border border-denied-500/30 bg-denied-50 px-3 py-2 text-sm text-denied-700">
              {parseError}
            </div>
          )}
          <button
            type="button"
            className="text-xs font-medium text-brass-600 hover:underline"
            onClick={downloadTemplate}
          >
            Download CSV template
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          {parseError && (
            <div className="rounded-lg border border-caution-500/30 bg-caution-50 px-3 py-2 text-sm text-caution-700">
              {parseError}
            </div>
          )}
          <div className="flex gap-4 text-sm">
            <span className="text-verified-700">{validRows.length} ready to import</span>
            <span className="text-denied-700">{invalidRows.length} with errors</span>
          </div>
          <div className="max-h-72 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="table-base min-w-[560px]">
              <thead>
                <tr>
                  <th>Register No.</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const hasErrors = Object.keys(r.errors).length > 0;
                  return (
                    <tr key={i} className={hasErrors ? 'bg-denied-50/50' : ''}>
                      <td className="font-id">{r.data.registerNumber || '—'}</td>
                      <td>{r.data.fullName || '—'}</td>
                      <td>{r.data.department || '—'}</td>
                      <td>{r.data.year || '—'}</td>
                      <td className="text-xs">
                        {hasErrors ? (
                          <span className="text-denied-600" title={Object.values(r.errors).join('; ')}>
                            {Object.values(r.errors)[0]}
                          </span>
                        ) : (
                          <span className="text-verified-600">Ready</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={startImport} disabled={validRows.length === 0}>
              Import {validRows.length} student{validRows.length === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 py-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Importing {importIndex} of {validRows.length}…
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-brass-500 transition-all duration-300"
              style={{ width: `${(importIndex / Math.max(validRows.length, 1)) * 100}%` }}
            />
          </div>
          <button
            type="button"
            className="text-xs text-slate-400 hover:underline"
            onClick={() => { cancelRef.current = true; }}
          >
            Cancel remaining
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-verified-50 p-3">
              <p className="text-2xl font-semibold text-verified-700">{successCount}</p>
              <p className="text-xs text-verified-600">Imported</p>
            </div>
            <div className="rounded-lg bg-caution-50 p-3">
              <p className="text-2xl font-semibold text-caution-700">{duplicateCount}</p>
              <p className="text-xs text-caution-600">Duplicates</p>
            </div>
            <div className="rounded-lg bg-denied-50 p-3">
              <p className="text-2xl font-semibold text-denied-700">{failedCount}</p>
              <p className="text-xs text-denied-600">Failed</p>
            </div>
          </div>
          {(duplicateCount > 0 || failedCount > 0) && (
            <button type="button" className="btn-secondary text-xs" onClick={handleDownloadFailures}>
              Download failure report
            </button>
          )}
          <div className="flex justify-end">
            <Button onClick={handleFinish}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
