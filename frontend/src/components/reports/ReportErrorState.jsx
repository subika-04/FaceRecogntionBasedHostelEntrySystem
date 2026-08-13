import ErrorMessage from '../common/ErrorMessage';

export default function ReportErrorState({ message, onRetry }) {
  return <ErrorMessage message={message || 'Failed to generate this report.'} onRetry={onRetry} />;
}
