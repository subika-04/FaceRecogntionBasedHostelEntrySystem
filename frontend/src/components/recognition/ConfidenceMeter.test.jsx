import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConfidenceMeter from './ConfidenceMeter';

describe('ConfidenceMeter', () => {
  it('renders the confidence as a rounded percentage', () => {
    render(<ConfidenceMeter confidence={0.876} status="MATCHED" />);
    expect(screen.getByText('87.6%')).toBeInTheDocument();
  });

  it('exposes an accessible meter role with correct aria value bounds', () => {
    render(<ConfidenceMeter confidence={0.5} status="MATCHED" />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '50');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
  });

  it('clamps out-of-range confidence values into 0-100%', () => {
    render(<ConfidenceMeter confidence={1.5} status="MATCHED" />);
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });

  it('defaults to 0% when confidence is not provided', () => {
    render(<ConfidenceMeter status="UNKNOWN" />);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });
});
