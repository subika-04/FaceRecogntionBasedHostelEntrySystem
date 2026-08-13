import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as studentApi from '../../api/studentApi';
import * as recognitionApi from '../../api/recognitionApi';
import Drawer from '../ui/Drawer';
import StudentSummaryHeader from './StudentSummaryHeader';
import StudentInfoGrid from './StudentInfoGrid';
import RecognitionEventCard from '../recognition/RecognitionEventCard';
import { SkeletonCard } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import ErrorMessage, { extractErrorMessage } from '../common/ErrorMessage';

/**
 * "Quick look without leaving the list" -- reuses StudentSummaryHeader and
 * StudentInfoGrid (the exact same components StudentDetailPage uses) rather
 * than re-describing this layout, and adds only what's genuinely new here: a
 * compact recognition-history preview for this one student.
 */
export default function StudentProfileDrawer({ studentId, open, onClose }) {
  const [student, setStudent] = useState(null);
  const [recentRecognitions, setRecentRecognitions] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !studentId) return;
    setStudent(null);
    setRecentRecognitions(null);
    setError(null);

    studentApi
      .getStudentById(studentId)
      .then(setStudent)
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load student.')));

    recognitionApi
      .getRecognitionHistory({ studentId, page: 0, size: 5, sortBy: 'recognizedAt', sortDir: 'desc' })
      .then((data) => setRecentRecognitions(data.content || []))
      .catch(() => setRecentRecognitions([])); // non-critical -- the drawer still works without this preview
  }, [open, studentId]);

  const latest = recentRecognitions?.[0];

  return (
    <Drawer open={open} title="Student Quick View" onClose={onClose}>
      <ErrorMessage message={error} />

      {!student ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="space-y-6">
          <StudentSummaryHeader student={student} avatarSize={56} />
          <StudentInfoGrid student={student} compact />

          {latest && (
            <div className="rounded-lg border border-slate-100 p-3 dark:border-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-400">Latest Recognition Confidence</p>
              <p className="mt-1 font-id text-lg font-semibold text-ink dark:text-slate-100">
                {(latest.confidence * 100).toFixed(1)}%
              </p>
            </div>
          )}

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recent Recognitions
            </h4>
            {recentRecognitions === null ? (
              <SkeletonCard />
            ) : recentRecognitions.length === 0 ? (
              <EmptyState title="No recognitions yet" description="This student hasn't been recognized at the gate yet." />
            ) : (
              <div className="space-y-1">
                {recentRecognitions.map((r) => (
                  <RecognitionEventCard key={r.id} record={r} compact />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
            <Link to={`/students/${student.id}`} className="btn-secondary text-center" onClick={onClose}>
              View Full Profile
            </Link>
            {student.enrollmentStatus !== 'ENROLLED' && (
              <Link to={`/students/${student.id}?enroll=1`} className="btn-primary text-center" onClick={onClose}>
                {student.enrollmentStatus === 'FAILED' ? 'Retry Enrollment' : 'Start Enrollment'}
              </Link>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
