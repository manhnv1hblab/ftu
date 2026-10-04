export const MAX_DRAFT_BYTES = 512_000;
export const REVIEW_SEMESTERS = ['Học kỳ I', 'Học kỳ II', 'Học kỳ Hè'] as const;

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isValidDataVersion(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9._-]{1,100}$/.test(value);
}

export function isSafeLocalRedirect(value: string | null): value is string {
  return Boolean(value && value.startsWith('/') && !value.startsWith('//'));
}

export function publicReview<T extends { is_anonymous: boolean; display_name?: string | null }>(review: T): T {
  return review.is_anonymous ? { ...review, display_name: null } : review;
}
