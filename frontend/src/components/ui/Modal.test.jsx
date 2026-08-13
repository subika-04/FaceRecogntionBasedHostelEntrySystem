import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  it('renders nothing when open is false', () => {
    render(<Modal open={false} title="Test" onClose={() => {}}>Content</Modal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the dialog with an accessible label matching the title when open', () => {
    render(<Modal open title="Confirm delete" onClose={() => {}}>Are you sure?</Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Confirm delete');
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onClose when the Escape key is pressed while open', async () => {
    const onClose = vi.fn();
    render(<Modal open title="Test" onClose={onClose}>Content</Modal>);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not listen for Escape when closed', async () => {
    const onClose = vi.fn();
    render(<Modal open={false} title="Test" onClose={onClose}>Content</Modal>);
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    render(<Modal open title="Test" onClose={onClose}>Content</Modal>);
    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('removes its keydown listener on unmount (no stale handler firing onClose later)', async () => {
    const onClose = vi.fn();
    const { unmount } = render(<Modal open title="Test" onClose={onClose}>Content</Modal>);
    unmount();
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });
});
