import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecognitionTimeline from './RecognitionTimeline';

const records = [
  { id: 1, status: 'MATCHED', recognizedAt: '2026-01-15T10:00:00Z', recognizedByCamera: 'CAM01', student: { fullName: 'Jane Doe' } },
  { id: 2, status: 'UNKNOWN', recognizedAt: '2026-01-15T11:00:00Z', recognizedByCamera: 'CAM02', student: null },
];

describe('RecognitionTimeline', () => {
  it('renders skeleton placeholders while loading, not the records or empty state', () => {
    const { container } = render(<RecognitionTimeline records={records} loading />);
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('No activity yet')).not.toBeInTheDocument();
    expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThan(0);
  });

  it('shows the empty state with a custom message when there are no records', () => {
    render(<RecognitionTimeline records={[]} loading={false} emptyMessage="Nothing to show for today." />);
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
    expect(screen.getByText('Nothing to show for today.')).toBeInTheDocument();
  });

  it('treats a null/undefined records prop the same as empty, not as an error', () => {
    render(<RecognitionTimeline records={null} loading={false} />);
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
  });

  it('renders one event card per record as an ordered list', () => {
    render(<RecognitionTimeline records={records} loading={false} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Unrecognized face')).toBeInTheDocument();
  });
});
