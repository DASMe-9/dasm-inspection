/**
 * Unit tests for DASM-e inspection scoring library.
 *
 * Test runner: Vitest (compatible with Jest API).
 * To run: npm run test -- lib/inspection/scoring.test.ts
 *
 * Coverage targets:
 *   - All exported functions
 *   - Edge cases: null inputs, missing sections, all-null, boundary scores
 *   - Invariants: weights sum to 100, threshold ordering
 */

import { describe, it, expect } from 'vitest';
import {
  CONDITION_SCORES,
  SECTION_WEIGHTS,
  computeFinalGrade,
  computeWeightedScore,
  conditionToScore,
  extractSectionScores,
  scoreToAuctionTrack,
  scoreToLetterGrade,
  type ConditionGrade,
  type MinimalWorkshopLayer,
  type SectionKey,
} from './scoring';

// =============================================================================
// Constants & invariants
// =============================================================================

describe('Invariants', () => {
  it('SECTION_WEIGHTS sum equals 100', () => {
    const total = Object.values(SECTION_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });

  it('SECTION_WEIGHTS body_paint is the highest', () => {
    const sorted = Object.entries(SECTION_WEIGHTS).sort(([, a], [, b]) => b - a);
    expect(sorted[0][0]).toBe('body_paint');
    expect(sorted[0][1]).toBe(25);
  });

  it('CONDITION_SCORES match documented values', () => {
    expect(CONDITION_SCORES.excellent).toBe(100);
    expect(CONDITION_SCORES.good).toBe(85);
    expect(CONDITION_SCORES.fair).toBe(60);
    expect(CONDITION_SCORES.poor).toBe(30);
    expect(CONDITION_SCORES.critical).toBe(0);
    expect(CONDITION_SCORES.not_tested).toBe(null);
  });
});

// =============================================================================
// conditionToScore
// =============================================================================

describe('conditionToScore', () => {
  it.each([
    ['excellent', 100],
    ['good', 85],
    ['fair', 60],
    ['poor', 30],
    ['critical', 0],
  ] as const)('%s → %d', (condition, expected) => {
    expect(conditionToScore(condition)).toBe(expected);
  });

  it('not_tested returns null', () => {
    expect(conditionToScore('not_tested')).toBe(null);
  });

  it('undefined returns null', () => {
    expect(conditionToScore(undefined)).toBe(null);
  });

  it('null returns null', () => {
    expect(conditionToScore(null)).toBe(null);
  });

  it('unknown string returns null (defensive)', () => {
    expect(conditionToScore('completely_destroyed' as unknown as ConditionGrade)).toBe(null);
  });
});

// =============================================================================
// scoreToLetterGrade
// =============================================================================

describe('scoreToLetterGrade', () => {
  it.each([
    [100, 'A'],
    [95, 'A'],
    [85, 'A'],   // boundary
    [84.9, 'B'],
    [80, 'B'],
    [70, 'B'],   // boundary
    [69.9, 'C'],
    [60, 'C'],
    [55, 'C'],   // boundary
    [54.9, 'D'],
    [45, 'D'],
    [40, 'D'],   // boundary
    [39.9, 'F'],
    [20, 'F'],
    [0, 'F'],    // boundary low
  ] as const)('score %d → grade %s', (score, expected) => {
    expect(scoreToLetterGrade(score)).toBe(expected);
  });

  it('throws on negative score', () => {
    expect(() => scoreToLetterGrade(-1)).toThrow(RangeError);
  });

  it('throws on score > 100', () => {
    expect(() => scoreToLetterGrade(101)).toThrow(RangeError);
  });

  it('throws on NaN', () => {
    expect(() => scoreToLetterGrade(NaN)).toThrow(TypeError);
  });

  it('throws on non-numeric input', () => {
    expect(() => scoreToLetterGrade('80' as unknown as number)).toThrow(TypeError);
  });
});

// =============================================================================
// scoreToAuctionTrack
// =============================================================================

describe('scoreToAuctionTrack', () => {
  it.each([
    [100, 'haraj_live'],
    [90, 'haraj_live'],
    [85, 'haraj_live'],     // boundary
    [84.9, 'instant'],
    [75, 'instant'],
    [70, 'instant'],         // boundary
    [69.9, 'delayed'],
    [60, 'delayed'],
    [55, 'delayed'],         // boundary
    [54.9, 'fixed'],
    [45, 'fixed'],
    [40, 'fixed'],           // boundary
    [39.9, 'rejected'],
    [10, 'rejected'],
    [0, 'rejected'],         // boundary low
  ] as const)('score %d → track %s', (score, expected) => {
    expect(scoreToAuctionTrack(score)).toBe(expected);
  });

  it('throws on out-of-range', () => {
    expect(() => scoreToAuctionTrack(-1)).toThrow(RangeError);
    expect(() => scoreToAuctionTrack(101)).toThrow(RangeError);
  });
});

// =============================================================================
// extractSectionScores
// =============================================================================

describe('extractSectionScores', () => {
  it('returns all-null for null input', () => {
    const result = extractSectionScores(null);
    const allNull = (Object.values(result) as Array<number | null>).every((v) => v === null);
    expect(allNull).toBe(true);
  });

  it('returns all-null for undefined input', () => {
    const result = extractSectionScores(undefined);
    const allNull = (Object.values(result) as Array<number | null>).every((v) => v === null);
    expect(allNull).toBe(true);
  });

  it('returns all-null for empty object', () => {
    const result = extractSectionScores({});
    const allNull = (Object.values(result) as Array<number | null>).every((v) => v === null);
    expect(allNull).toBe(true);
  });

  it('extracts a single section correctly', () => {
    const layer: MinimalWorkshopLayer = {
      engine: { overall_status: 'good' },
    };
    const result = extractSectionScores(layer);
    expect(result.engine).toBe(85);
    expect(result.transmission).toBe(null);
  });

  it('handles partial sections (no overall_status)', () => {
    const layer: MinimalWorkshopLayer = {
      engine: {}, // present but no status
    };
    const result = extractSectionScores(layer);
    expect(result.engine).toBe(null);
  });

  it('extracts all 8 sections', () => {
    const layer: MinimalWorkshopLayer = {
      engine: { overall_status: 'excellent' },
      transmission: { overall_status: 'good' },
      electrical: { overall_status: 'excellent' },
      body_paint: { overall_status: 'good' },
      ac_cooling: { overall_status: 'fair' },
      suspension_tires: { overall_status: 'fair' },
      interior: { overall_status: 'excellent' },
      road_test: { overall_status: 'good' },
    };
    const result = extractSectionScores(layer);
    expect(result).toEqual({
      engine: 100,
      transmission: 85,
      electrical: 100,
      body_paint: 85,
      ac_cooling: 60,
      suspension_tires: 60,
      interior: 100,
      road_test: 85,
    });
  });
});

// =============================================================================
// computeWeightedScore
// =============================================================================

describe('computeWeightedScore', () => {
  const allNull: Record<SectionKey, number | null> = {
    engine: null,
    transmission: null,
    electrical: null,
    body_paint: null,
    ac_cooling: null,
    suspension_tires: null,
    interior: null,
    road_test: null,
  };

  it('returns null when all sections are null', () => {
    expect(computeWeightedScore(allNull)).toBe(null);
  });

  it('computes correctly when all sections are 100 (excellent)', () => {
    const allExcellent = Object.fromEntries(
      Object.keys(SECTION_WEIGHTS).map((k) => [k, 100])
    ) as Record<SectionKey, number>;
    expect(computeWeightedScore(allExcellent)).toBe(100);
  });

  it('computes correctly when all sections are 0 (critical)', () => {
    const allCritical = Object.fromEntries(
      Object.keys(SECTION_WEIGHTS).map((k) => [k, 0])
    ) as Record<SectionKey, number>;
    expect(computeWeightedScore(allCritical)).toBe(0);
  });

  it('renormalizes when a section is missing', () => {
    // If engine (20%) is the only section, it should still be 85
    // because weights renormalize to 100% of active sections.
    const onlyEngine: Record<SectionKey, number | null> = { ...allNull, engine: 85 };
    expect(computeWeightedScore(onlyEngine)).toBe(85);
  });

  it('computes mixed weighted average correctly', () => {
    // body_paint (25%) = 100, engine (20%) = 85, all others null
    // Expected: (100*25 + 85*20) / (25+20) = (2500 + 1700) / 45 = 4200 / 45 = 93.33...
    const scores: Record<SectionKey, number | null> = {
      ...allNull,
      body_paint: 100,
      engine: 85,
    };
    expect(computeWeightedScore(scores)).toBeCloseTo(93.3, 1);
  });

  it('rounds to 1 decimal place', () => {
    const scores: Record<SectionKey, number | null> = {
      ...allNull,
      engine: 33,
      transmission: 67,
    };
    const result = computeWeightedScore(scores);
    // Result should have at most 1 decimal place
    if (result !== null) {
      expect(result).toBe(Number(result.toFixed(1)));
    }
  });
});

// =============================================================================
// computeFinalGrade — integration tests
// =============================================================================

describe('computeFinalGrade', () => {
  it('returns degenerate F/rejected for null input', () => {
    const result = computeFinalGrade(null);
    expect(result.finalScore).toBe(0);
    expect(result.letterGrade).toBe('F');
    expect(result.auctionTrack).toBe('rejected');
    expect(result.sectionsExcluded).toHaveLength(8);
  });

  it('returns degenerate for empty object', () => {
    const result = computeFinalGrade({});
    expect(result.finalScore).toBe(0);
    expect(result.letterGrade).toBe('F');
    expect(result.auctionTrack).toBe('rejected');
  });

  it('grades a fully excellent vehicle as A / haraj_live', () => {
    const layer: MinimalWorkshopLayer = {
      engine: { overall_status: 'excellent' },
      transmission: { overall_status: 'excellent' },
      electrical: { overall_status: 'excellent' },
      body_paint: { overall_status: 'excellent' },
      ac_cooling: { overall_status: 'excellent' },
      suspension_tires: { overall_status: 'excellent' },
      interior: { overall_status: 'excellent' },
      road_test: { overall_status: 'excellent' },
    };
    const result = computeFinalGrade(layer);
    expect(result.finalScore).toBe(100);
    expect(result.letterGrade).toBe('A');
    expect(result.auctionTrack).toBe('haraj_live');
    expect(result.sectionsExcluded).toHaveLength(0);
  });

  it('grades a fully critical vehicle as F / rejected', () => {
    const layer: MinimalWorkshopLayer = {
      engine: { overall_status: 'critical' },
      transmission: { overall_status: 'critical' },
      electrical: { overall_status: 'critical' },
      body_paint: { overall_status: 'critical' },
      ac_cooling: { overall_status: 'critical' },
      suspension_tires: { overall_status: 'critical' },
      interior: { overall_status: 'critical' },
      road_test: { overall_status: 'critical' },
    };
    const result = computeFinalGrade(layer);
    expect(result.finalScore).toBe(0);
    expect(result.letterGrade).toBe('F');
    expect(result.auctionTrack).toBe('rejected');
  });

  it('matches the example from the architecture doc (Toyota Camry B-grade)', () => {
    // Example from README: a typical Camry with mostly good condition,
    // some fair items, scoring ~82.
    const layer: MinimalWorkshopLayer = {
      body_paint: { overall_status: 'good' },        // 25% * 85 = 21.25
      engine: { overall_status: 'good' },             // 20% * 85 = 17.0
      transmission: { overall_status: 'good' },       // 15% * 85 = 12.75
      electrical: { overall_status: 'excellent' },    // 10% * 100 = 10.0
      suspension_tires: { overall_status: 'fair' },   // 10% * 60 = 6.0
      ac_cooling: { overall_status: 'fair' },         //  8% * 60 = 4.8
      road_test: { overall_status: 'good' },          //  7% * 85 = 5.95
      interior: { overall_status: 'excellent' },      //  5% * 100 = 5.0
    };
    // Sum: 21.25 + 17.0 + 12.75 + 10.0 + 6.0 + 4.8 + 5.95 + 5.0 = 82.75
    const result = computeFinalGrade(layer);
    expect(result.finalScore).toBeCloseTo(82.8, 1);
    expect(result.letterGrade).toBe('B');
    expect(result.auctionTrack).toBe('instant');
  });

  it('handles EV scenario (no transmission)', () => {
    // EV with no transmission section. Weight should redistribute.
    const layer: MinimalWorkshopLayer = {
      engine: { overall_status: 'excellent' },
      transmission: { overall_status: 'not_tested' }, // explicitly not tested
      electrical: { overall_status: 'excellent' },
      body_paint: { overall_status: 'good' },
      ac_cooling: { overall_status: 'good' },
      suspension_tires: { overall_status: 'good' },
      interior: { overall_status: 'excellent' },
      road_test: { overall_status: 'good' },
    };
    const result = computeFinalGrade(layer);
    // transmission excluded → 7 sections counted, 85% weight active
    // Numerator: 25*85 + 20*100 + 10*100 + 10*85 + 8*85 + 5*100 + 7*85 = 2125+2000+1000+850+680+500+595 = 7750
    // Denominator: 25+20+10+10+8+5+7 = 85
    // 7750 / 85 = 91.18
    expect(result.finalScore).toBeCloseTo(91.2, 1);
    expect(result.letterGrade).toBe('A');
    expect(result.auctionTrack).toBe('haraj_live');
    expect(result.sectionsExcluded).toEqual(['transmission']);
  });

  it('exposes section scores in the result', () => {
    const layer: MinimalWorkshopLayer = {
      engine: { overall_status: 'good' },
    };
    const result = computeFinalGrade(layer);
    expect(result.sectionScores.engine).toBe(85);
    expect(result.sectionScores.transmission).toBe(null);
  });

  it('result object is well-typed and complete', () => {
    const layer: MinimalWorkshopLayer = {
      engine: { overall_status: 'good' },
      body_paint: { overall_status: 'excellent' },
    };
    const result = computeFinalGrade(layer);
    expect(result).toHaveProperty('finalScore');
    expect(result).toHaveProperty('letterGrade');
    expect(result).toHaveProperty('auctionTrack');
    expect(result).toHaveProperty('sectionScores');
    expect(result).toHaveProperty('sectionsExcluded');
    expect(Object.keys(result.sectionScores)).toHaveLength(8);
  });
});

// =============================================================================
// Boundary tests at threshold edges
// =============================================================================

describe('Boundary behavior at grade thresholds', () => {
  it('score 85.0 → A (inclusive)', () => {
    expect(scoreToLetterGrade(85.0)).toBe('A');
    expect(scoreToAuctionTrack(85.0)).toBe('haraj_live');
  });

  it('score 84.99 → B', () => {
    expect(scoreToLetterGrade(84.99)).toBe('B');
    expect(scoreToAuctionTrack(84.99)).toBe('instant');
  });

  it('score 40.0 → D (inclusive)', () => {
    expect(scoreToLetterGrade(40.0)).toBe('D');
    expect(scoreToAuctionTrack(40.0)).toBe('fixed');
  });

  it('score 39.99 → F / rejected', () => {
    expect(scoreToLetterGrade(39.99)).toBe('F');
    expect(scoreToAuctionTrack(39.99)).toBe('rejected');
  });
});
