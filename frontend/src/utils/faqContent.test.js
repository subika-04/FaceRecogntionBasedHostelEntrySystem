import { describe, it, expect } from 'vitest';
import { FAQ_CATEGORIES, filterFaqByRole, searchFaq } from './faqContent';
import { ROLES } from './constants';

describe('FAQ_CATEGORIES', () => {
  it('has at least one question in every category', () => {
    FAQ_CATEGORIES.forEach((category) => {
      expect(category.questions.length).toBeGreaterThan(0);
    });
  });

  it('gates Analytics/Reports and System Settings to ADMIN only', () => {
    const adminOnly = FAQ_CATEGORIES.filter((c) => c.roles);
    const ids = adminOnly.map((c) => c.id);
    expect(ids).toContain('analytics-reports');
    expect(ids).toContain('settings');
    adminOnly.forEach((c) => expect(c.roles).toEqual([ROLES.ADMIN]));
  });
});

describe('filterFaqByRole', () => {
  it('returns every category for an ADMIN role', () => {
    const result = filterFaqByRole(FAQ_CATEGORIES, ROLES.ADMIN);
    expect(result.length).toBe(FAQ_CATEGORIES.length);
  });

  it('excludes role-gated categories for a STAFF role', () => {
    const result = filterFaqByRole(FAQ_CATEGORIES, ROLES.STAFF);
    const ids = result.map((c) => c.id);
    expect(ids).not.toContain('analytics-reports');
    expect(ids).not.toContain('settings');
    expect(result.length).toBeLessThan(FAQ_CATEGORIES.length);
  });

  it('drops any category left with zero questions after filtering', () => {
    const categories = [
      { id: 'a', questions: [{ q: 'x', a: 'y' }] },
      { id: 'b', questions: [] },
    ];
    expect(filterFaqByRole(categories, ROLES.ADMIN).map((c) => c.id)).toEqual(['a']);
  });
});

describe('searchFaq', () => {
  it('returns everything unchanged for a blank query', () => {
    expect(searchFaq(FAQ_CATEGORIES, '')).toEqual(FAQ_CATEGORIES);
    expect(searchFaq(FAQ_CATEGORIES, '   ')).toEqual(FAQ_CATEGORIES);
  });

  it('matches against both question and answer text, case-insensitively', () => {
    const result = searchFaq(FAQ_CATEGORIES, 'CONFIDENCE THRESHOLD');
    const allQuestions = result.flatMap((c) => c.questions);
    expect(allQuestions.length).toBeGreaterThan(0);
  });

  it('returns no categories when nothing matches', () => {
    expect(searchFaq(FAQ_CATEGORIES, 'xyznonexistenttermzzz')).toEqual([]);
  });

  it('only keeps the matching questions within a category, not the whole category', () => {
    const categories = [
      {
        id: 'a',
        questions: [
          { q: 'apple pie recipe', a: 'bake at 350' },
          { q: 'banana bread recipe', a: 'bake at 375' },
        ],
      },
    ];
    const result = searchFaq(categories, 'apple');
    expect(result).toHaveLength(1);
    expect(result[0].questions).toHaveLength(1);
    expect(result[0].questions[0].q).toBe('apple pie recipe');
  });
});
