import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FaqItem from './FaqItem';

describe('FaqItem', () => {
  it('renders the question but hides the answer by default', () => {
    render(<FaqItem id="1" question="What is this?" answer="It is a thing." />);
    expect(screen.getByText('What is this?')).toBeInTheDocument();
    expect(screen.queryByText('It is a thing.')).not.toBeInTheDocument();
  });

  it('respects defaultOpen', () => {
    render(<FaqItem id="1" question="What is this?" answer="It is a thing." defaultOpen />);
    expect(screen.getByText('It is a thing.')).toBeInTheDocument();
  });

  it('toggles the answer open and closed on click, updating aria-expanded', async () => {
    render(<FaqItem id="1" question="What is this?" answer="It is a thing." />);
    const button = screen.getByRole('button', { name: 'What is this?' });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('It is a thing.')).toBeInTheDocument();

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('It is a thing.')).not.toBeInTheDocument();
  });

  it('links the button to its panel via aria-controls', async () => {
    render(<FaqItem id="section-1" question="Q" answer="A" defaultOpen />);
    const button = screen.getByRole('button', { name: 'Q' });
    const controlsId = button.getAttribute('aria-controls');
    expect(controlsId).toBe('faq-panel-section-1');
    expect(document.getElementById(controlsId)).toHaveTextContent('A');
  });
});
