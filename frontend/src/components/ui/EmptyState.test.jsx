import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders the title always, and the description/action only when provided', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByText('description text')).not.toBeInTheDocument();
  });

  it('renders an optional description', () => {
    render(<EmptyState title="Nothing here" description="Try a different filter." />);
    expect(screen.getByText('Try a different filter.')).toBeInTheDocument();
  });

  it('renders an optional action element', () => {
    render(<EmptyState title="Nothing here" action={<button>Reset</button>} />);
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('renders the title as a heading for screen-reader navigation', () => {
    render(<EmptyState title="No results" />);
    expect(screen.getByRole('heading', { name: 'No results' })).toBeInTheDocument();
  });
});
