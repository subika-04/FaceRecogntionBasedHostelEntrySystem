import { describe, it, expect } from 'vitest';
import { CHART_COLORS, CHART_MARGIN } from './chartTheme';

describe('CHART_COLORS', () => {
  it('defines every color key the existing charts depend on, as valid hex strings', () => {
    ['primary', 'primaryDark', 'verified', 'caution', 'denied', 'ink', 'axis', 'grid'].forEach((key) => {
      expect(CHART_COLORS[key]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});

describe('CHART_MARGIN', () => {
  it('defines all four Recharts margin properties as numbers', () => {
    ['top', 'right', 'bottom', 'left'].forEach((key) => {
      expect(typeof CHART_MARGIN[key]).toBe('number');
    });
  });
});
