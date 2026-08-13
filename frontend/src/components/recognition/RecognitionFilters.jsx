import { RECOGNITION_STATUS } from '../../utils/constants';
import { applyRecordFilters } from '../../utils/recognitionRecordFilters';

const DEFAULT_FILTERS = {
  status: '',
  camera: '',
  studentQuery: '',
  dateFrom: '',
  dateTo: '',
  minConfidence: '',
  maxConfidence: '',
};

export { DEFAULT_FILTERS };

// values: filters object (see DEFAULT_FILTERS shape), onChange: (patch) => void, onReset: () => void
export default function RecognitionFilters({ values, onChange, onReset }) {
  const set = (key) => (e) => onChange({ [key]: e.target.value });

  return (
    <div className="card space-y-3 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <label className="label text-xs" htmlFor="rf-status">Status</label>
          <select id="rf-status" className="input" value={values.status} onChange={set('status')}>
            <option value="">All statuses</option>
            {RECOGNITION_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label text-xs" htmlFor="rf-camera">Camera</label>
          <input id="rf-camera" className="input" placeholder="e.g. CAM01" value={values.camera} onChange={set('camera')} />
        </div>
        <div className="col-span-2 sm:col-span-1 lg:col-span-2">
          <label className="label text-xs" htmlFor="rf-student-query">Student name or register no.</label>
          <input id="rf-student-query" className="input" placeholder="Search loaded results…" value={values.studentQuery} onChange={set('studentQuery')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="label text-xs" htmlFor="rf-date-from">From</label>
          <input id="rf-date-from" type="date" className="input" value={values.dateFrom} onChange={set('dateFrom')} />
        </div>
        <div>
          <label className="label text-xs" htmlFor="rf-date-to">To</label>
          <input id="rf-date-to" type="date" className="input" value={values.dateTo} onChange={set('dateTo')} />
        </div>
        <div>
          <label className="label text-xs" htmlFor="rf-min-confidence">Min. Confidence %</label>
          <input id="rf-min-confidence" type="number" min="0" max="100" className="input" value={values.minConfidence} onChange={set('minConfidence')} />
        </div>
        <div>
          <label className="label text-xs" htmlFor="rf-max-confidence">Max. Confidence %</label>
          <input id="rf-max-confidence" type="number" min="0" max="100" className="input" value={values.maxConfidence} onChange={set('maxConfidence')} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-slate-400">
          Status and camera query the server. Name, date, and confidence filters apply to the currently loaded results only.
        </p>
        <button type="button" className="btn-secondary shrink-0 text-xs" onClick={onReset}>
          Reset filters
        </button>
      </div>
    </div>
  );
}

/**
 * Thin re-export for backward compatibility with existing callers
 * (RecognitionPage) -- the actual filtering logic now lives in
 * utils/recognitionRecordFilters.js, shared with Analytics's filter panel.
 */
export const applyClientFilters = applyRecordFilters;
