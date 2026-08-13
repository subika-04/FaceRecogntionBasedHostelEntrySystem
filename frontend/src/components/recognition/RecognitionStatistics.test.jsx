import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecognitionStatistics from './RecognitionStatistics';

const now = new Date();
const todayIso = now.toISOString();
const twoWeeksAgoIso = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

describe('RecognitionStatistics', () => {
  it('renders all-zero/placeholder stats for an empty record set, without dividing by zero', () => {
    render(<RecognitionStatistics records={[]} />);
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // avg confidence
    expect(screen.getByText('—')).toBeInTheDocument(); // avg response (no durations at all)
    expect(screen.getByText('0 / 0')).toBeInTheDocument(); // today / week
  });

  it('defaults to an empty array when no records prop is given at all', () => {
    expect(() => render(<RecognitionStatistics />)).not.toThrow();
  });

  it('computes total, successful, and failed counts correctly', () => {
    const records = [
      { status: 'MATCHED', recognizedAt: todayIso, confidence: 0.9 },
      { status: 'MATCHED', recognizedAt: todayIso, confidence: 0.8 },
      { status: 'UNKNOWN', recognizedAt: todayIso, confidence: 0.2 },
    ];
    render(<RecognitionStatistics records={records} />);
    expect(screen.getByText('3')).toBeInTheDocument(); // total
    expect(screen.getByText('2')).toBeInTheDocument(); // successful
    expect(screen.getByText('1')).toBeInTheDocument(); // failed
  });

  it('computes average confidence across all records regardless of status', () => {
    const records = [
      { status: 'MATCHED', recognizedAt: todayIso, confidence: 1.0 },
      { status: 'UNKNOWN', recognizedAt: todayIso, confidence: 0.0 },
    ];
    render(<RecognitionStatistics records={records} />);
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('averages duration only over records that actually have one', () => {
    const records = [
      { status: 'MATCHED', recognizedAt: todayIso, confidence: 0.9, recognitionDurationMs: 100 },
      { status: 'MATCHED', recognizedAt: todayIso, confidence: 0.9, recognitionDurationMs: 200 },
      { status: 'MATCHED', recognizedAt: todayIso, confidence: 0.9 }, // no duration -- excluded
    ];
    render(<RecognitionStatistics records={records} />);
    expect(screen.getByText('150 ms')).toBeInTheDocument();
  });

  it('separates today-count from week-count using each record\'s own recognizedAt', () => {
    const records = [
      { status: 'MATCHED', recognizedAt: todayIso, confidence: 0.9 },
      { status: 'MATCHED', recognizedAt: twoWeeksAgoIso, confidence: 0.9 },
    ];
    render(<RecognitionStatistics records={records} />);
    expect(screen.getByText('1 / 1')).toBeInTheDocument(); // today=1 (only the today record), week=1 (2wk-old is outside 7 days)
  });
});
