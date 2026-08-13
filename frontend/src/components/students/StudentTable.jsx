import { Link } from 'react-router-dom';
import StudentAvatar from './StudentAvatar';
import StatusBadge from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

// students: StudentResponse[]
// selectedIds/onToggleSelect/onToggleSelectAll: optional -- bulk-selection is
// opt-in so any other caller of this table doesn't need to wire it up.
// onQuickView: optional (id) => void -- opens StudentProfileDrawer without navigating away.
export default function StudentTable({ students, onDelete, onQuickView, selectedIds, onToggleSelect, onToggleSelectAll }) {
  const { user } = useAuth();
  const bulkEnabled = user?.role === ROLES.ADMIN && !!onToggleSelect;

  if (!students || students.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">No students found.</p>;
  }

  const allSelected = bulkEnabled && students.length > 0 && students.every((s) => selectedIds?.has(s.id));

  return (
    <>
      {/* Mobile: avatar-forward card list instead of a cramped horizontally-
          scrolling table. Photos are the fastest way for staff to confirm
          "is this the right student" at a glance, so they're large here. */}
      <ul className="divide-y divide-slate-100 dark:divide-slate-700 md:hidden">
        {students.map((s) => (
          <li key={s.id} className="flex items-start gap-3 p-4">
            {bulkEnabled && (
              <input
                type="checkbox"
                aria-label={`Select ${s.fullName}`}
                checked={!!selectedIds?.has(s.id)}
                onChange={() => onToggleSelect(s.id)}
                className="mt-1 shrink-0"
              />
            )}
            <StudentAvatar profileImageUrl={s.profileImageUrl} name={s.fullName} size={56} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/students/${s.id}`} className="truncate font-medium text-brass-600 hover:underline">
                  {s.fullName}
                </Link>
                <StatusBadge value={s.enrollmentStatus} />
              </div>
              <p className="mt-0.5 font-id text-xs text-slate-500 dark:text-slate-400">{s.registerNumber}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {s.department} · Year {s.year} · {s.hostelStatus === 'HOSTELLER' ? 'Hosteller' : 'Day Scholar'}
              </p>
              <div className="mt-3 flex gap-2">
                {onQuickView && (
                  <button onClick={() => onQuickView(s.id)} className="btn-secondary px-2 py-1 text-xs">
                    Quick View
                  </button>
                )}
                <Link to={`/students/${s.id}`} className="btn-secondary px-2 py-1 text-xs">
                  View
                </Link>
                {user?.role === ROLES.ADMIN && (
                  <button onClick={() => onDelete(s)} className="btn-danger px-2 py-1 text-xs">
                    Delete
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop / tablet: full data table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="table-base">
          <thead>
            <tr>
              {bulkEnabled && (
                <th className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all students on this page"
                    checked={allSelected}
                    onChange={() => onToggleSelectAll(students.map((s) => s.id), !allSelected)}
                  />
                </th>
              )}
              <th>Student</th>
              <th>Register No.</th>
              <th>Department</th>
              <th>Year</th>
              <th>Hostel Status</th>
              <th>Enrollment</th>
              <th>Registered By</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                {bulkEnabled && (
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${s.fullName}`}
                      checked={!!selectedIds?.has(s.id)}
                      onChange={() => onToggleSelect(s.id)}
                    />
                  </td>
                )}
                <td>
                  <div className="flex items-center gap-3">
                    <StudentAvatar profileImageUrl={s.profileImageUrl} name={s.fullName} size={36} />
                    <Link to={`/students/${s.id}`} className="font-medium text-brass-600 hover:underline">
                      {s.fullName}
                    </Link>
                  </div>
                </td>
                <td className="font-id">{s.registerNumber}</td>
                <td>{s.department}</td>
                <td>{s.year}</td>
                <td>{s.hostelStatus === 'HOSTELLER' ? 'Hosteller' : 'Day Scholar'}</td>
                <td>
                  <StatusBadge value={s.enrollmentStatus} />
                </td>
                <td>{s.registeredByUsername}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    {onQuickView && (
                      <button onClick={() => onQuickView(s.id)} className="btn-secondary px-2 py-1 text-xs">
                        Quick View
                      </button>
                    )}
                    <Link to={`/students/${s.id}`} className="btn-secondary px-2 py-1 text-xs">
                      View
                    </Link>
                    {user?.role === ROLES.ADMIN && (
                      <button
                        onClick={() => onDelete(s)}
                        className="btn-danger px-2 py-1 text-xs"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
