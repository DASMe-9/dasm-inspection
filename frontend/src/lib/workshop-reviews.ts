export const WORKSHOP_REVIEW_MIN_RATING = 1;
export const WORKSHOP_REVIEW_MAX_RATING = 5;

export function isValidWorkshopRating(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= WORKSHOP_REVIEW_MIN_RATING &&
    value <= WORKSHOP_REVIEW_MAX_RATING
  );
}

export function normalizeWorkshopReviewComment(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 2000);
}

export function averageWorkshopRating(
  ratings: number[]
): { average: number; count: number } | null {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return {
    average: Math.round((sum / ratings.length) * 10) / 10,
    count: ratings.length,
  };
}
