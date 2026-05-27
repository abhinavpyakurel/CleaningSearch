export type ReviewStats = {
  average_rating: number;
  review_count: number;
};

export function buildReviewStatsByReviewee(
  rows: { reviewee_id: string; rating: number }[]
): Map<string, ReviewStats> {
  const sums = new Map<string, { sum: number; count: number }>();

  for (const row of rows) {
    const current = sums.get(row.reviewee_id) ?? { sum: 0, count: 0 };
    current.sum += row.rating;
    current.count += 1;
    sums.set(row.reviewee_id, current);
  }

  const stats = new Map<string, ReviewStats>();

  for (const [revieweeId, { sum, count }] of sums) {
    stats.set(revieweeId, {
      average_rating: Math.round((sum / count) * 10) / 10,
      review_count: count,
    });
  }

  return stats;
}
