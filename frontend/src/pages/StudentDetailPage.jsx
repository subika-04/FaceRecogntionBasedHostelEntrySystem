import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import * as studentApi from '../api/studentApi';
import StudentForm from '../components/students/StudentForm';
import StudentSummaryHeader from '../components/students/StudentSummaryHeader';
import StudentInfoGrid from '../components/students/StudentInfoGrid';
import EnrollmentCapture from '../components/students/EnrollmentCapture';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage, { extractErrorMessage } from '../components/common/ErrorMessage';

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const enrolling = searchParams.get('enroll') === '1';

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentApi.getStudentById(id);
      setStudent(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load student.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdate = async (values) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await studentApi.updateStudent(id, values);
      setStudent(updated);
      setEditing(false);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to update student.'));
    } finally {
      setSaving(false);
    }
  };

  const startEnrollment = () => setSearchParams({ enroll: '1' });
  const stopEnrollment = () => {
    searchParams.delete('enroll');
    setSearchParams(searchParams);
  };

  if (loading) return <LoadingSpinner full label="Loading student…" />;
  if (error && !student) return <ErrorMessage message={error} onRetry={load} />;
  if (!student) return null;

  return (
    <div className="max-w-3xl space-y-4">
      <button onClick={() => navigate('/students')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-ink dark:hover:text-slate-100">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to students
      </button>

      <ErrorMessage message={error} />

      <div className="card p-6">
        <StudentSummaryHeader
          student={student}
          avatarSize={96}
          actions={
            !editing && (
              <>
                <button onClick={() => setEditing(true)} className="btn-secondary">
                  Edit Details
                </button>
                {student.enrollmentStatus !== 'ENROLLED' && !enrolling && (
                  <button onClick={startEnrollment} className="btn-primary">
                    {student.enrollmentStatus === 'FAILED' ? 'Retry Enrollment' : 'Start Enrollment'}
                  </button>
                )}
              </>
            )
          }
        />

        {!editing && (
          <div className="mt-6">
            <StudentInfoGrid student={student} />
          </div>
        )}

        {editing && (
          <div className="mt-6">
            <StudentForm
              initialValues={student}
              onSubmit={handleUpdate}
              submitting={saving}
              submitLabel="Save Changes"
            />
            <button onClick={() => setEditing(false)} className="mt-2 text-sm text-slate-500 hover:underline">
              Cancel
            </button>
          </div>
        )}
      </div>

      {enrolling && (
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Biometric Face Enrollment</h3>
            <button onClick={stopEnrollment} className="text-xs text-slate-400 hover:underline">
              Cancel
            </button>
          </div>
          <EnrollmentCapture
            studentId={student.id}
            onComplete={(updated) => {
              setStudent(updated);
              stopEnrollment();
            }}
          />
        </div>
      )}
    </div>
  );
}
