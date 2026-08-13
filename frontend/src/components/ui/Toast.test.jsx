import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './Toast';

function Trigger() {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success('Saved successfully')}>Show success</button>
      <button onClick={() => toast.error('Something failed')}>Show error</button>
      <button onClick={() => toast.show('Plain info', { duration: 0 })}>Show persistent</button>
    </div>
  );
}

describe('useToast', () => {
  it('throws a clear error when used outside a ToastProvider', () => {
    // Suppress the expected React error-boundary console noise for this one case.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useToast())).toThrow('useToast must be used within a ToastProvider');
    spy.mockRestore();
  });
});

describe('ToastProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a success toast with the right role and message on demand', async () => {
    render(<ToastProvider><Trigger /></ToastProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Show success' }));
    expect(screen.getByRole('status')).toHaveTextContent('Saved successfully');
  });

  it('renders an error toast distinctly from a success toast', async () => {
    render(<ToastProvider><Trigger /></ToastProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Show error' }));
    expect(screen.getByRole('status')).toHaveTextContent('Something failed');
  });

  it('dismisses a toast when its dismiss button is clicked', async () => {
    render(<ToastProvider><Trigger /></ToastProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Show success' }));
    expect(screen.getByRole('status')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('auto-dismisses a toast after its duration elapses', () => {
    vi.useFakeTimers();
    render(<ToastProvider><Trigger /></ToastProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Show success' }));
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('never auto-dismisses when duration is 0', () => {
    vi.useFakeTimers();
    render(<ToastProvider><Trigger /></ToastProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Show persistent' }));
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('supports multiple simultaneous toasts', async () => {
    render(<ToastProvider><Trigger /></ToastProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Show success' }));
    await userEvent.click(screen.getByRole('button', { name: 'Show error' }));
    expect(screen.getAllByRole('status')).toHaveLength(2);
  });
});
