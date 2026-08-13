import { Link } from 'react-router-dom';
import { Camera } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatDateTime, formatConfidence } from '../../utils/formatters';

// records: RecognitionHistoryResponse[]
export default function HistoryTable({ records, linkToDetail = true }) {
  if (!records || records.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">No recognition records found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            <th>Student</th>
            <th>Camera</th>
            <th>Status</th>
            <th>Confidence</th>
            <th>Duration</th>
            <th>Recognized At</th>
            <th>Triggered By</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td>
                {r.student ? (
                  linkToDetail ? (
                    <Link
                      to={`/students/${r.student.id}`}
                      className="font-medium text-brass-600 hover:underline"
                    >
                      {r.student.fullName}
                    </Link>
                  ) : (
                    <span className="font-medium">{r.student.fullName}</span>
                  )
                ) : r.capturedImageUrl ? (
                  <Link
                    to="/recognition/history"
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-brass-600 hover:underline"
                    title="A photo of this unrecognized face was captured -- open it in the recognition timeline"
                  >
                    <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                    Unknown
                  </Link>
                ) : (
                  <span className="text-slate-400">Unknown</span>
                )}
              </td>
              <td>{r.recognizedByCamera}</td>
              <td>
                <StatusBadge value={r.status} />
              </td>
              <td>{formatConfidence(r.confidenceScore)}</td>
              <td>{r.recognitionDurationMs ?? '—'} ms</td>
              <td>{formatDateTime(r.recognizedAt)}</td>
              <td>{r.triggeredByUsername || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
