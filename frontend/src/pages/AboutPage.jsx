import { Link } from 'react-router-dom';
import { ORG_NAME, ORG_SHORT, REPORT_CONFIDENTIALITY_NOTICE } from '../utils/orgInfo';

const APP_VERSION = '1.0.0';

const SERVICES = [
  { name: 'Frontend', tech: 'React 18 + Vite + Tailwind CSS', role: 'This application \u2014 the browser UI everyone signs into.' },
  { name: 'Backend API', tech: 'Spring Boot 3.2 (Java 17)', role: 'Authentication, students, recognition history, analytics, settings, and user management.' },
  { name: 'AI Service', tech: 'Flask + InsightFace + OpenCV', role: 'Face detection and matching; called internally by the backend, never directly by the browser.' },
];

const MODULES = [
  { name: 'Students', detail: 'Registration, five-pose face enrollment, CSV bulk import, profile management.' },
  { name: 'Live Recognition', detail: 'Real-time camera capture and match/unknown/low-confidence results.' },
  { name: 'Recognition History', detail: 'Searchable, filterable log of every recognition attempt.' },
  { name: 'Analytics', detail: 'Trend, peak-hours, camera, latency, and confidence charts with saved filter presets.', adminOnly: true },
  { name: 'Reports', detail: 'Printable, templated reports plus full-dataset CSV exports.', adminOnly: true },
  { name: 'Notifications', detail: 'Polling alerts for failures, low-confidence matches, and system health.' },
  { name: 'User Management', detail: 'Create accounts, assign roles, lock/unlock access.', adminOnly: true },
  { name: 'System Settings', detail: 'Recognition threshold, camera sources, token expiry, and password policy.', adminOnly: true },
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brass-500 font-display text-base font-bold text-white">
            FR
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-ink dark:text-slate-100">{ORG_NAME}</h2>
            <p className="text-xs text-slate-400">Version {APP_VERSION}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {ORG_SHORT} automates hostel entry logging using face recognition, replacing manual
          register-based check-ins with camera-based identification, searchable history, and
          reporting.
        </p>
      </div>

      <div className="card p-5">
        <h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Architecture</h3>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Three services, deployed independently (see the project README for run instructions).
        </p>
        <div className="mt-3 space-y-3">
          {SERVICES.map((svc) => (
            <div key={svc.name} className="flex items-start justify-between gap-4 border-t border-slate-100 pt-3 first:border-t-0 first:pt-0 dark:border-slate-700">
              <div>
                <p className="text-sm font-medium text-ink dark:text-slate-100">{svc.name}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{svc.role}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {svc.tech}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Modules</h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {MODULES.map((mod) => (
            <li key={mod.name} className="rounded-lg border border-slate-100 p-3 dark:border-slate-700">
              <p className="flex items-center gap-2 text-sm font-medium text-ink dark:text-slate-100">
                {mod.name}
                {mod.adminOnly && (
                  <span className="rounded-full bg-brass-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brass-700 dark:bg-slate-700 dark:text-brass-400">
                    Admin
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{mod.detail}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-5">
        <h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Data handling</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{REPORT_CONFIDENTIALITY_NOTICE}</p>
      </div>

      <p className="px-1 text-xs text-slate-400">
        Questions about how something works?{' '}
        <Link to="/help" className="font-medium text-brass-600 hover:underline">
          Visit Help
        </Link>
        .
      </p>
    </div>
  );
}
