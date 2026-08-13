import { useEffect, useRef, useState } from 'react';
import * as recognitionApi from '../../api/recognitionApi';
import RecognitionEventCard from './RecognitionEventCard';
import { SkeletonTable } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

const POLL_INTERVAL_MS = 15000;

/**
 * Polls GET /recognition/history (no new endpoint -- same one
 * RecognitionHistoryPage and RecognitionPage's timeline use), sorted newest
 * first, on an interval. Not a WebSocket/SSE push feed -- this project has
 * no backend push infrastructure, and adding one would be new architecture,
 * which this batch is explicitly not doing. Polling every 15s is a
 * reasonable approximation of "live" for a gate-entry log.
 */
export default function RecognitionLiveFeed({ limit = 10 }) {
  const [records, setRecords] = useState(null);
  const [connectionOk, setConnectionOk] = useState(true);
  const mountedRef = useRef(true);

  const fetchLatest = async () => {
    try {
      const data = await recognitionApi.getRecognitionHistory({
        page: 0,
        size: limit,
        sortBy: 'recognizedAt',
        sortDir: 'desc',
      });
      if (mountedRef.current) {
        setRecords(data.content || []);
        setConnectionOk(true);
      }
    } catch {
      if (mountedRef.current) setConnectionOk(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchLatest();
    const interval = setInterval(fetchLatest, POLL_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Live Activity</h2>
        <span className={`flex items-center gap-1.5 text-xs font-medium ${connectionOk ? 'text-verified-600' : 'text-denied-600'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${connectionOk ? 'bg-verified-500 animate-pulse' : 'bg-denied-500'}`} aria-hidden="true" />
          {connectionOk ? 'Live' : 'Reconnecting…'}
        </span>
      </div>

      {records === null ? (
        <SkeletonTable rows={4} columns={2} />
      ) : records.length === 0 ? (
        <EmptyState title="No recent activity" description="New recognition events will appear here automatically." />
      ) : (
        <div className="max-h-96 space-y-1 overflow-y-auto">
          {records.map((r) => (
            <RecognitionEventCard key={r.id} record={r} compact />
          ))}
        </div>
      )}
    </div>
  );
}
