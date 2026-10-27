/**
 * The rule that decides which photo represents a place or a destination on a card.
 *
 * Lives on its own, with no imports and no side effects, so it can be tested
 * without standing up an Amplify client. backfillCardPhotos.ts is the only
 * caller here; the CLI at ../personal-site-cli reimplements the same rule in
 * closest_to_four_thirds, and the two must agree or a backfill re-run churns
 * every row the CLI wrote.
 */
export const DESIRED_RATIO = 4 / 3;

export type RankablePhoto = { photoId: string; width: string; height: string };

/**
 * Distance from 4:3, or Infinity when the dimensions cannot be divided.
 *
 * Width and height are stored as strings. A row with a missing, non-numeric or
 * zero dimension sorts last rather than poisoning the comparison with NaN,
 * which compares false against everything and would make the sort order
 * depend on where the bad row happened to sit.
 */
export function distanceFromFourThirds(photo: RankablePhoto): number {
  const width = parseFloat(photo.width);
  const height = parseFloat(photo.height);
  if (!isFinite(width) || !isFinite(height) || height === 0) return Infinity;
  return Math.abs(DESIRED_RATIO - width / height);
}

/**
 * Closest to 4:3 wins, with the lowest photoId breaking a tie.
 *
 * Most of the library is 2048x1536, which is exactly 4:3, so ties are the norm
 * rather than the exception -- one Prague destination had 28 candidates with six
 * or more at distance zero. Without the tie-break the winner came down to the
 * order rows happened to arrive in, so this and the CLI's closest_to_four_thirds
 * could pick different photos from the same set, and neither was idempotent.
 * Both sort on (distance, photoId) so they agree and stay put.
 *
 * Returns undefined when there is nothing usable to choose from.
 */
export function closestToFourThirds<T extends RankablePhoto>(photos: T[]): T | undefined {
  const usable = photos.filter((photo) => distanceFromFourThirds(photo) !== Infinity);
  return [...usable].sort(
    (a, b) => distanceFromFourThirds(a) - distanceFromFourThirds(b) || a.photoId.localeCompare(b.photoId),
  )[0];
}
