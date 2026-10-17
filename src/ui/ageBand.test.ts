import { describe, expect, it } from 'vitest';
import { ageBandForGrade, applyAgeBand } from './ageBand';

describe('ageBandForGrade', () => {
  it('maps gan → young, grades 1–3 → middle, grades 4–6 → older', () => {
    expect(ageBandForGrade(0)).toBe('young');
    expect(ageBandForGrade(1)).toBe('middle');
    expect(ageBandForGrade(3)).toBe('middle');
    expect(ageBandForGrade(4)).toBe('older');
    expect(ageBandForGrade(6)).toBe('older');
  });
});

describe('applyAgeBand', () => {
  it('sets data-age on <html>', () => {
    applyAgeBand('young');
    expect(document.documentElement.dataset['age']).toBe('young');
  });
});
