/**
 * Age bands drive sizing and density (see tokens.css). They map from the grade
 * in the child's profile; the mapping lives here so it is testable and in one place.
 */
export type AgeBand = 'young' | 'middle' | 'older';

/** Grades as stored in a profile. 0 = gan hova (kindergarten). */
export type Grade = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function ageBandForGrade(grade: Grade): AgeBand {
  if (grade === 0) return 'young';
  if (grade <= 3) return 'middle';
  return 'older';
}

/** Applies the band to the document so CSS tokens switch. */
export function applyAgeBand(band: AgeBand): void {
  document.documentElement.dataset['age'] = band;
}

export const AGE_BANDS: readonly AgeBand[] = ['young', 'middle', 'older'];
