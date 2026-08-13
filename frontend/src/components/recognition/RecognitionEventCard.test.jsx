import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecognitionEventCard from './RecognitionEventCard';

vi.mock('../../api/recognitionApi', () => ({
  fetchCapturedFaceImageBlobUrl: vi.fn().mockResolvedValue('blob:mock-captured-face'),
  downloadCapturedFaceImage: vi.fn().mockResolvedValue(undefined),
}));

import { downloadCapturedFaceImage } from '../../api/recognitionApi';

const record = {
  id: 1,
  status: 'MATCHED',
  recognizedAt: '2026-01-15T10:00:00Z',
  recognizedByCamera: 'CAM01',
  confidence: 0.92,
  recognitionDurationMs: 150,
  student: { fullName: 'Jane Doe', registerNumber: 'REG001' },
};

describe('RecognitionEventCard (compact mode)', () => {
  it('renders name, camera/time, and status badge without an expand affordance', () => {
    render(<RecognitionEventCard record={record} compact />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Matched')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('falls back to "Unrecognized" when there is no student', () => {
    render(<RecognitionEventCard record={{ ...record, student: null }} compact />);
    expect(screen.getByText('Unrecognized')).toBeInTheDocument();
  });
});

describe('RecognitionEventCard (full mode)', () => {
  it('starts collapsed, hiding the detail panel', () => {
    render(<RecognitionEventCard record={record} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('REG001')).not.toBeInTheDocument();
  });

  it('expands on click to reveal register number, camera, duration, and confidence', async () => {
    render(<RecognitionEventCard record={record} />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('REG001')).toBeInTheDocument();
    expect(screen.getByText('CAM01')).toBeInTheDocument();
    expect(screen.getByText('150 ms')).toBeInTheDocument();
    // 92.0% appears twice: once inside ConfidenceMeter itself, once in the dl summary.
    expect(screen.getAllByText('92.0%')).toHaveLength(2);
  });

  it('collapses again on a second click', async () => {
    render(<RecognitionEventCard record={record} />);
    const button = screen.getByRole('button');
    await userEvent.click(button);
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('REG001')).not.toBeInTheDocument();
  });

  it('shows placeholders for a missing register number and duration', async () => {
    const partialRecord = { ...record, student: { fullName: 'Jane Doe' }, recognitionDurationMs: undefined };
    render(<RecognitionEventCard record={partialRecord} />);
    await userEvent.click(screen.getByRole('button'));
    // register number and duration both fall back to an em dash placeholder
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Unrecognized face" (not "Unrecognized") for a missing student in full mode', () => {
    render(<RecognitionEventCard record={{ ...record, student: null }} />);
    expect(screen.getByText('Unrecognized face')).toBeInTheDocument();
  });
});

describe('RecognitionEventCard (unrecognized face with a captured photo)', () => {
  const unknownRecord = {
    ...record,
    status: 'UNKNOWN',
    student: null,
    capturedImageUrl: '/recognition/images/unrecognized_abc.jpg',
  };

  it('renders the actual captured photo instead of a "?" placeholder once expanded', async () => {
    render(<RecognitionEventCard record={unknownRecord} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getAllByRole('img', { name: /unrecognized face captured by camera/i }).length).toBeGreaterThan(0);
    });
    expect(screen.getByText('Captured photo')).toBeInTheDocument();
  });

  it('lets staff download the captured photo', async () => {
    render(<RecognitionEventCard record={unknownRecord} />);
    await userEvent.click(screen.getByRole('button'));
    const downloadButton = await screen.findByRole('button', { name: /download photo/i });
    await userEvent.click(downloadButton);
    expect(downloadCapturedFaceImage).toHaveBeenCalledWith(unknownRecord.capturedImageUrl, `unrecognized-face-${unknownRecord.id}.jpg`);
  });

  it('does not show the photo panel when no image was captured for an unknown face', async () => {
    render(<RecognitionEventCard record={{ ...unknownRecord, capturedImageUrl: null }} />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('Captured photo')).not.toBeInTheDocument();
  });
});
