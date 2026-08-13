export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-denied-500/30 bg-denied-50 px-4 py-3 text-sm text-denied-700">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="font-medium underline underline-offset-2">
          Retry
        </button>
      )}
    </div>
  );
}

export function extractErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    (typeof err?.response?.data === 'string' ? err.response.data : null) ||
    fallback
  );
}
