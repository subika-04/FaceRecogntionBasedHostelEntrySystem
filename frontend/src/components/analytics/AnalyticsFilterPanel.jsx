import { RECOGNITION_STATUS, DEFAULT_CAMERA_SOURCES } from '../../utils/constants';

export const DEFAULT_ANALYTICS_FILTERS = {
  status: '',
  camera: '',
  department: '',
  studentQuery: '',
  dateFrom: '',
  dateTo: '',
  minConfidence: '',
  maxConfidence: '',
  minLatencyMs: '',
  maxLatencyMs: '',
};

/**
 * Unlike RecognitionFilters (where status/camera are real server query
 * params against /recognition/history), every field here filters whatever
 * sample AnalyticsPage already fetched via getRecentActivity -- that
 * endpoint takes only a `limit`, no filter params. Said plainly in the UI
 * rather than implied to be a full-dataset query.
 *
 * values/onChange/onReset: same controlled-component contract as
 * RecognitionFilters, so both can be driven the same way by a parent page.
 * departments: string[] derived by the caller from the current record
 * sample (see AnalyticsPage), so the dropdown only ever offers real values.
 */
export default function AnalyticsFilterPanel({ values, onChange, onReset, departments = [] }) {
  const set = (key) => (e) => onChange({ [key]: e.target.value });

  return (
    <div className="card space-y-3 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <label className="label text-xs" htmlFor="af-status">Status</label>
          <select id="af-status" className="input" value={values.status} onChange={set('status')}>
            <option value="">All statuses</option>
            {RECOGNITION_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label text-xs" htmlFor="af-camera">Camera</label>
          <select id="af-camera" className="input" value={values.camera} onChange={set('camera')}>
            <option value="">All cameras</option>
            {DEFAULT_CAMERA_SOURCES.map((c) => (
              <option key={c.id} value={c.id}>{c.label} ({c.id})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label text-xs" htmlFor="af-department">Department</label>
          <select id="af-department" className="input" value={values.department} onChange={set('department')}>
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label text-xs" htmlFor="af-student">Student name / register no.</label>
          <input id="af-student" className="input" value={values.studentQuery} onChange={set('studentQuery')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <label className="label text-xs" htmlFor="af-from">From</label>
          <input id="af-from" type="date" className="input" value={values.dateFrom} onChange={set('dateFrom')} />
        </div>
        <div>
          <label className="label text-xs" htmlFor="af-to">To</label>
          <input id="af-to" type="date" className="input" value={values.dateTo} onChange={set('dateTo')} />
        </div>
        <div>
          <label className="label text-xs" htmlFor="af-minconf">Min. Confidence %</label>
          <input id="af-minconf" type="number" min="0" max="100" className="input" value={values.minConfidence} onChange={set('minConfidence')} />
        </div>
        <div>
          <label className="label text-xs" htmlFor="af-maxconf">Max. Confidence %</label>
          <input id="af-maxconf" type="number" min="0" max="100" className="input" value={values.maxConfidence} onChange={set('maxConfidence')} />
        </div>
        <div>
          <label className="label text-xs" htmlFor="af-minlat">Min. Latency (ms)</label>
          <input id="af-minlat" type="number" min="0" className="input" value={values.minLatencyMs} onChange={set('minLatencyMs')} />
        </div>
        <div>
          <label className="label text-xs" htmlFor="af-maxlat">Max. Latency (ms)</label>
          <input id="af-maxlat" type="number" min="0" className="input" value={values.maxLatencyMs} onChange={set('maxLatencyMs')} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-slate-400">
          All filters here apply to the currently loaded recognition sample, not the full historical dataset.
        </p>
        <button type="button" className="btn-secondary shrink-0 text-xs" onClick={onReset}>
          Reset filters
        </button>
      </div>
    </div>
  );
}
