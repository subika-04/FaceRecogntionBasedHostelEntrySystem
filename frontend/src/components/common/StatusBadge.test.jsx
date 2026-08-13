import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders an em dash placeholder when given no value', () => {
    render(<StatusBadge value={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders the title-cased label for a known status', () => {
    render(<StatusBadge value="LOW_CONFIDENCE" />);
    expect(screen.getByText('Low Confidence')).toBeInTheDocument();
  });

  it('still renders a readable label for an unrecognized status value, falling back to neutral styling', () => {
    render(<StatusBadge value="SOME_NEW_STATUS" />);
    expect(screen.getByText('Some New Status')).toBeInTheDocument();
  });

  it.each(['MATCHED', 'UNKNOWN', 'LOW_CONFIDENCE', 'ENROLLED', 'PENDING', 'FAILED', 'ACTIVE', 'INACTIVE'])(
    'renders %s without throwing',
    (value) => {
      expect(() => render(<StatusBadge value={value} />)).not.toThrow();
    }
  );
});
