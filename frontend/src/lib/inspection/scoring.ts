/**
 * DASM-e Inspection Scoring Library
 *
 * Pure functions to compute the final inspection score, letter grade, and
 * auction track from a workshop_layer JSON object.
 *
 * No external dependencies. No side effects. Fully testable in isolation.
 *
 * Aligns with:
 *   - docs/schemas/dasm_inspection_schema.json
 *   - docs/architecture/inspection-integration.md
 *   - docs/handoffs/cursor_findings_handoff.md
 *
 * Authored by: Claude (analysis assistant)
 * Date: 2026-05-22
 *
 * Usage:
 *   import { computeFinalGrade } from '@/lib/inspection/scoring';
 *
 *   const grade = computeFinalGrade(report.workshop_layer);
 *   // grade.finalScore: 82.4
 *   // grade.letterGrade: 'B'
 *   // grade.auctionTrack: 'instant'
 *   // grade.sectionScores: { engine: 82, ... }
 */

// =============================================================================
// Types
// =============================================================================

export type ConditionGrade =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'critical'
  | 'not_tested';

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export type AuctionTrack =
  | 'haraj_live'
  | 'instant'
  | 'delayed'
  | 'fixed'
  | 'rejected';

export type SectionKey =
  | 'engine'
  | 'transmission'
  | 'electrical'
  | 'body_paint'
  | 'ac_cooling'
  | 'suspension_tires'
  | 'interior'
  | 'road_test';

/**
 * Minimal shape of workshop_layer needed for scoring.
 * The actual JSONB blob has more fields; we only depend on overall_status
 * per section. Full type is in docs/schemas/dasm_inspection_schema.json.
 */
export interface MinimalWorkshopLayer {
  engine?: { overall_status?: ConditionGrade };
  transmission?: { overall_status?: ConditionGrade };
  electrical?: { overall_status?: ConditionGrade };
  body_paint?: { overall_status?: ConditionGrade };
  ac_cooling?: { overall_status?: ConditionGrade };
  suspension_tires?: { overall_status?: ConditionGrade };
  interior?: { overall_status?: ConditionGrade };
  road_test?: { overall_status?: ConditionGrade };
}

export interface ComputedGrade {
  /** Final weighted score, 0–100, rounded to 1 decimal */
  finalScore: number;
  /** Letter grade derived from finalScore */
  letterGrade: LetterGrade;
  /** Recommended auction track */
  auctionTrack: AuctionTrack;
  /** Per-section raw scores (0–100, before weighting), useful for UI */
  sectionScores: Record<SectionKey, number | null>;
  /** Sections that were not_tested or missing — excluded from weighted average */
  sectionsExcluded: SectionKey[];
}

// =============================================================================
// Constants — Single source of truth
// =============================================================================

/**
 * Section weights as approved by محمد الزهراني (2026-05-22).
 * Sum must equal 100.
 *
 * Body & paint is weighted highest (25%) because in the Saudi used-car market,
 * accident history is the dominant value driver. Engine follows at 20%.
 */
export const SECTION_WEIGHTS: Readonly<Record<SectionKey, number>> = Object.freeze({
  body_paint: 25,
  engine: 20,
  transmission: 15,
  electrical: 10,
  suspension_tires: 10,
  ac_cooling: 8,
  road_test: 7,
  interior: 5,
});

/**
 * Sanity check: total must equal 100.
 * Throws at module load if weights are misconfigured.
 */
const TOTAL_WEIGHT = Object.values(SECTION_WEIGHTS).reduce((a, b) => a + b, 0);
if (TOTAL_WEIGHT !== 100) {
  throw new Error(
    `[DASM-e scoring] Section weights must sum to 100, got ${TOTAL_WEIGHT}`
  );
}

/**
 * Condition → numeric score mapping.
 *
 * 'not_tested' is special: it does not contribute to the score (the section
 * is excluded from the average). This prevents penalizing reports where a
 * section was genuinely inapplicable (e.g., EV without traditional transmission).
 */
export const CONDITION_SCORES: Readonly<Record<ConditionGrade, number | null>> =
  Object.freeze({
    excellent: 100,
    good: 85,
    fair: 60,
    poor: 30,
    critical: 0,
    not_tested: null,
  });

/**
 * Letter grade thresholds.
 * A: 85+, B: 70-84, C: 55-69, D: 40-54, F: <40
 */
const LETTER_GRADE_THRESHOLDS: ReadonlyArray<{ min: number; grade: LetterGrade }> = [
  { min: 85, grade: 'A' },
  { min: 70, grade: 'B' },
  { min: 55, grade: 'C' },
  { min: 40, grade: 'D' },
  { min: 0, grade: 'F' },
];

/**
 * Auction track thresholds based on final_score.
 * Matches the four-tier auction system in DASM-Platform.
 */
const AUCTION_TRACK_THRESHOLDS: ReadonlyArray<{ min: number; track: AuctionTrack }> = [
  { min: 85, track: 'haraj_live' },
  { min: 70, track: 'instant' },
  { min: 55, track: 'delayed' },
  { min: 40, track: 'fixed' },
  { min: 0, track: 'rejected' },
];

// =============================================================================
// Pure scoring functions
// =============================================================================

/**
 * Convert a single condition grade to a numeric score.
 * Returns null for 'not_tested' (excluded from average).
 */
export function conditionToScore(
  condition: ConditionGrade | undefined | null
): number | null {
  if (condition === undefined || condition === null) return null;
  // Defensive: handle unknown values gracefully
  if (!(condition in CONDITION_SCORES)) return null;
  return CONDITION_SCORES[condition];
}

/**
 * Convert a final numeric score to a letter grade.
 * Score must be in range [0, 100]. Throws on invalid input.
 */
export function scoreToLetterGrade(score: number): LetterGrade {
  if (typeof score !== 'number' || isNaN(score)) {
    throw new TypeError(`[scoreToLetterGrade] score must be a number, got ${typeof score}`);
  }
  if (score < 0 || score > 100) {
    throw new RangeError(`[scoreToLetterGrade] score must be 0–100, got ${score}`);
  }
  const found = LETTER_GRADE_THRESHOLDS.find((t) => score >= t.min);
  // The last threshold has min: 0, so this is unreachable for valid input.
  // But TypeScript can't prove that, so we provide a fallback.
  return found?.grade ?? 'F';
}

/**
 * Recommend an auction track based on final score.
 */
export function scoreToAuctionTrack(score: number): AuctionTrack {
  if (typeof score !== 'number' || isNaN(score)) {
    throw new TypeError(`[scoreToAuctionTrack] score must be a number, got ${typeof score}`);
  }
  if (score < 0 || score > 100) {
    throw new RangeError(`[scoreToAuctionTrack] score must be 0–100, got ${score}`);
  }
  const found = AUCTION_TRACK_THRESHOLDS.find((t) => score >= t.min);
  return found?.track ?? 'rejected';
}

/**
 * Compute the weighted final score from per-section scores.
 *
 * Sections with score === null (not_tested or missing) are excluded.
 * The weights of remaining sections are renormalized to 100%.
 *
 * Example: if 'transmission' is null (EV), its 15% is redistributed
 * proportionally across the other 7 sections.
 *
 * Returns null if all sections are missing (degenerate case).
 */
export function computeWeightedScore(
  sectionScores: Record<SectionKey, number | null>
): number | null {
  let weightedSum = 0;
  let activeWeightSum = 0;

  for (const key of Object.keys(SECTION_WEIGHTS) as SectionKey[]) {
    const score = sectionScores[key];
    if (score === null || score === undefined) continue;
    const weight = SECTION_WEIGHTS[key];
    weightedSum += score * weight;
    activeWeightSum += weight;
  }

  if (activeWeightSum === 0) return null;

  // Renormalize to base 100
  return Number((weightedSum / activeWeightSum).toFixed(1));
}

/**
 * Extract per-section scores from a workshop_layer.
 * Each section's score = its overall_status converted to numeric.
 *
 * Sections missing entirely (e.g., layer.engine === undefined) → null.
 * Sections present but with overall_status absent → null.
 */
export function extractSectionScores(
  layer: MinimalWorkshopLayer | null | undefined
): Record<SectionKey, number | null> {
  const sections: SectionKey[] = [
    'engine',
    'transmission',
    'electrical',
    'body_paint',
    'ac_cooling',
    'suspension_tires',
    'interior',
    'road_test',
  ];

  const result = {} as Record<SectionKey, number | null>;

  for (const key of sections) {
    if (!layer) {
      result[key] = null;
      continue;
    }
    const section = layer[key];
    const status = section?.overall_status;
    result[key] = conditionToScore(status);
  }

  return result;
}

/**
 * Main entry point: compute the full grade from a workshop_layer.
 *
 * Returns a degenerate result (finalScore=0, grade='F', track='rejected')
 * if the input is null/empty/unscoreable, rather than throwing. The caller
 * can check `sectionsExcluded.length === 8` to detect this.
 */
export function computeFinalGrade(
  workshopLayer: MinimalWorkshopLayer | null | undefined
): ComputedGrade {
  const sectionScores = extractSectionScores(workshopLayer);
  const sectionsExcluded = (Object.keys(sectionScores) as SectionKey[]).filter(
    (k) => sectionScores[k] === null
  );

  const finalScoreRaw = computeWeightedScore(sectionScores);

  // Degenerate case: nothing to score
  if (finalScoreRaw === null) {
    return {
      finalScore: 0,
      letterGrade: 'F',
      auctionTrack: 'rejected',
      sectionScores,
      sectionsExcluded,
    };
  }

  return {
    finalScore: finalScoreRaw,
    letterGrade: scoreToLetterGrade(finalScoreRaw),
    auctionTrack: scoreToAuctionTrack(finalScoreRaw),
    sectionScores,
    sectionsExcluded,
  };
}
