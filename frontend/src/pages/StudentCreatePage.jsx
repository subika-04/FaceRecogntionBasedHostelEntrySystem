import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as studentApi from '../api/studentApi';
import StudentForm from '../components/students/StudentForm';
import ErrorMessage, { extractErrorMessage } from '../components/common/ErrorMessage';

export default function StudentCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setError(null);
    try {
      const student = await studentApi.createStudent(values);
      // Move straight into biometric enrollment for the new record.
      navigate(`/students/${student.id}?enroll=1`);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to create student.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Register New Student</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Create the student record first, then capture 5 face poses to complete biometric enrollment.
        </p>
      </div>

      <ErrorMessage message={error} />

      <div className="card p-6">
        <StudentForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Create & Continue to Enrollment" />
      </div>
    </div>
  );
}
