import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecognitionSessionPanel from './RecognitionSessionPanel';

describe('RecognitionSessionPanel', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "Active" and a Pause button when active', () => {
    render(<RecognitionSessionPanel recognitionCount={3} active onPause={() => {}} onResume={() => {}} onStop={() => {}} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('shows "Paused" and a Resume button when not active', () => {
    render(<RecognitionSessionPanel recognitionCount={3} active={false} onPause={() => {}} onResume={() => {}} onStop={() => {}} />);
    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
  });

  it('displays the current recognition count as given by the parent', () => {
    render(<RecognitionSessionPanel recognitionCount={42} active onPause={() => {}} onResume={() => {}} onStop={() => {}} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('ticks the elapsed timer once per second while active', () => {
    vi.useFakeTimers();
    render(<RecognitionSessionPanel recognitionCount={0} active onPause={() => {}} onResume={() => {}} onStop={() => {}} />);
    expect(screen.getByText('00:00')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(65 * 1000);
    });
    expect(screen.getByText('01:05')).toBeInTheDocument();
  });

  it('does not tick while paused (inactive)', () => {
    vi.useFakeTimers();
    render(<RecognitionSessionPanel recognitionCount={0} active={false} onPause={() => {}} onResume={() => {}} onStop={() => {}} />);
    act(() => {
      vi.advanceTimersByTime(10 * 1000);
    });
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('calls onPause / onResume from their respective buttons', async () => {
    const onPause = vi.fn();
    render(<RecognitionSessionPanel recognitionCount={0} active onPause={onPause} onResume={() => {}} onStop={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('resets the visible elapsed time to 00:00 and calls onStop when ending the session', () => {
    vi.useFakeTimers();
    const onStop = vi.fn();
    render(<RecognitionSessionPanel recognitionCount={0} active onPause={() => {}} onResume={() => {}} onStop={onStop} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('00:05')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'End Session' }));
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });
});
