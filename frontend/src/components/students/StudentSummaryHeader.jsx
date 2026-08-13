import StudentAvatar from './StudentAvatar';
import StatusBadge from '../common/StatusBadge';

// student: StudentResponse, avatarSize: number, actions: optional node rendered on the right
export default function StudentSummaryHeader({ student, avatarSize = 72, actions }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4">
        <StudentAvatar profileImageUrl={student.profileImageUrl} name={student.fullName} size={avatarSize} />
        <div>
          <h2 className="font-display text-lg font-semibold text-ink dark:text-slate-100">{student.fullName}</h2>
          <p className="font-id text-sm text-slate-500 dark:text-slate-400">
            {student.registerNumber} · {student.department} · Year {student.year}
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <StatusBadge value={student.enrollmentStatus} />
            <span className="text-xs text-slate-400">
              {student.hostelStatus === 'HOSTELLER' ? 'Hosteller' : 'Day Scholar'}
            </span>
          </div>
        </div>
      </div>
      {actions && <div className="flex w-full shrink-0 flex-wrap justify-center gap-2 sm:w-auto sm:justify-end">{actions}</div>}
    </div>
  );
}
