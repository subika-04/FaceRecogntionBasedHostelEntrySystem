import { formatDateTime, titleCase } from '../../utils/formatters';

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-400">{label}</dt>
      <dd className="text-slate-700 dark:text-slate-200">{value || '—'}</dd>
    </div>
  );
}

// student: StudentResponse, compact: use a single column (for the narrower drawer)
export default function StudentInfoGrid({ student, compact = false }) {
  return (
    <dl className={`grid gap-4 text-sm ${compact ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
      <Field label="Phone" value={student.phone} />
      <Field label="Email" value={student.email} />
      <Field label="Registered By" value={student.registeredByUsername} />
      <Field label="Created At" value={formatDateTime(student.createdAt)} />
      <Field label="Enrollment Status" value={titleCase(student.enrollmentStatus)} />
    </dl>
  );
}
