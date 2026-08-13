import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecognitionFilters, { DEFAULT_FILTERS } from './RecognitionFilters';

describe('DEFAULT_FILTERS', () => {
  it('has every field blank', () => {
    Object.values(DEFAULT_FILTERS).forEach((v) => expect(v).toBe(''));
  });
});

describe('RecognitionFilters', () => {
  it('renders every filter control with its current value', () => {
    const values = { ...DEFAULT_FILTERS, camera: 'CAM01', studentQuery: 'Jane' };
    render(<RecognitionFilters values={values} onChange={() => {}} onReset={() => {}} />);
    expect(screen.getByPlaceholderText('e.g. CAM01')).toHaveValue('CAM01');
    expect(screen.getByPlaceholderText('Search loaded results…')).toHaveValue('Jane');
  });

  it('calls onChange with a single-key patch when the camera field changes', async () => {
    const onChange = vi.fn();
    render(<RecognitionFilters values={DEFAULT_FILTERS} onChange={onChange} onReset={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText('e.g. CAM01'), 'X');
    expect(onChange).toHaveBeenCalledWith({ camera: 'X' });
  });

  it('calls onChange with a status patch when the status select changes', async () => {
    const onChange = vi.fn();
    render(<RecognitionFilters values={DEFAULT_FILTERS} onChange={onChange} onReset={() => {}} />);
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'MATCHED');
    expect(onChange).toHaveBeenCalledWith({ status: 'MATCHED' });
  });

  it('lists every known recognition status as an option', () => {
    render(<RecognitionFilters values={DEFAULT_FILTERS} onChange={() => {}} onReset={() => {}} />);
    expect(screen.getByRole('option', { name: 'MATCHED' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'UNKNOWN' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'LOW_CONFIDENCE' })).toBeInTheDocument();
  });

  it('calls onReset when the reset button is clicked', async () => {
    const onReset = vi.fn();
    render(<RecognitionFilters values={DEFAULT_FILTERS} onChange={() => {}} onReset={onReset} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
