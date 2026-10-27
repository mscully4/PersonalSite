import { describe, expect, it } from 'vitest';
import { closestToFourThirds, distanceFromFourThirds } from './cardPhotoRule';

const photo = (photoId: string, width: string, height: string) => ({ photoId, width, height });

describe('closestToFourThirds', () => {
  it('prefers an exact 4:3 photo over anything else', () => {
    const photos = [photo('a', '1000', '1000'), photo('b', '2048', '1536'), photo('c', '1920', '1080')];
    expect(closestToFourThirds(photos)?.photoId).toBe('b');
  });

  it('picks the nearest when nothing is exact', () => {
    const photos = [photo('a', '1000', '1000'), photo('b', '1920', '1080'), photo('c', '1300', '1000')];
    expect(closestToFourThirds(photos)?.photoId).toBe('c');
  });

  it('compares on distance, not on which side of 4:3 a photo falls', () => {
    // 3:4 portrait is 0.583 away, 1.5 landscape is 0.167 away
    const photos = [photo('a', '1536', '2048'), photo('b', '1500', '1000')];
    expect(closestToFourThirds(photos)?.photoId).toBe('b');
  });

  it('breaks a tie on the lowest photoId', () => {
    const photos = [photo('c', '2048', '1536'), photo('a', '800', '600'), photo('b', '1024', '768')];
    expect(closestToFourThirds(photos)?.photoId).toBe('a');
  });

  /**
   * The regression that mattered. Most of the library is exactly 4:3, so the
   * distance alone left the winner up to the order rows arrived in -- which is
   * how 262 of 334 places ended up storing a different photo than a fresh run
   * computed, every one of them a tie rather than a worse photo.
   */
  it('does not depend on the order the photos arrive in', () => {
    const photos = [
      photo('d', '2048', '1536'),
      photo('b', '1024', '768'),
      photo('a', '800', '600'),
      photo('c', '1600', '1200'),
    ];
    const chosen = closestToFourThirds(photos)?.photoId;

    expect(chosen).toBe('a');
    expect(closestToFourThirds([...photos].reverse())?.photoId).toBe(chosen);
    expect(closestToFourThirds([...photos.slice(2), ...photos.slice(0, 2)])?.photoId).toBe(chosen);
  });

  it('does not mutate the array it was given', () => {
    const photos = [photo('c', '2048', '1536'), photo('a', '800', '600')];
    closestToFourThirds(photos);
    expect(photos.map((p) => p.photoId)).toEqual(['c', 'a']);
  });

  it('ignores photos it cannot measure rather than choosing one', () => {
    const photos = [photo('a', '', ''), photo('b', 'wide', 'tall'), photo('c', '2048', '1536')];
    expect(closestToFourThirds(photos)?.photoId).toBe('c');
  });

  it('ignores a zero height instead of dividing by it', () => {
    const photos = [photo('a', '2048', '0'), photo('b', '1920', '1080')];
    expect(closestToFourThirds(photos)?.photoId).toBe('b');
  });

  it('returns undefined when nothing is usable', () => {
    expect(closestToFourThirds([])).toBeUndefined();
    expect(closestToFourThirds([photo('a', 'x', 'y')])).toBeUndefined();
  });
});

describe('distanceFromFourThirds', () => {
  it('is zero for an exact 4:3 photo', () => {
    expect(distanceFromFourThirds(photo('a', '2048', '1536'))).toBe(0);
  });

  it('is Infinity for dimensions that cannot be divided, so bad rows sort last', () => {
    expect(distanceFromFourThirds(photo('a', 'nope', '1536'))).toBe(Infinity);
    expect(distanceFromFourThirds(photo('a', '2048', '0'))).toBe(Infinity);
  });
});
