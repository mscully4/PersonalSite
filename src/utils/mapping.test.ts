import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PLACE_ZOOM,
  GRANULARITIES,
  GRANULARITY_CUTOFF,
  getDistanceBetweenTwoPoints,
  granularitySwitcher,
} from './mapping';

describe('granularitySwitcher', () => {
  it('returns the destination variant at destination granularity', () => {
    expect(granularitySwitcher(GRANULARITIES.DESTINATIONS, 'dest', 'place')).toBe('dest');
  });

  it('returns the place variant at place granularity', () => {
    expect(granularitySwitcher(GRANULARITIES.PLACES, 'dest', 'place')).toBe('place');
  });

  /**
   * The travel view leans on this for data, handlers and render logic alike, so
   * it has to work for callbacks, not just values.
   */
  it('carries functions through untouched', () => {
    const onDestination = () => 'd';
    const onPlace = () => 'p';
    expect(granularitySwitcher(GRANULARITIES.PLACES, onDestination, onPlace)).toBe(onPlace);
  });
});

describe('DEFAULT_PLACE_ZOOM', () => {
  it('sits just past the cutoff, so flying to a place lands in place granularity', () => {
    expect(DEFAULT_PLACE_ZOOM).toBeGreaterThan(GRANULARITY_CUTOFF);
  });
});

describe('getDistanceBetweenTwoPoints', () => {
  it('is zero for a point against itself', () => {
    expect(getDistanceBetweenTwoPoints(30.2672, -97.7431, 30.2672, -97.7431)).toBe(0);
  });

  it('measures a known distance in miles', () => {
    // Austin to Dallas is roughly 182 miles as the crow flies
    const miles = getDistanceBetweenTwoPoints(30.2672, -97.7431, 32.7767, -96.797);
    expect(miles).toBeGreaterThan(175);
    expect(miles).toBeLessThan(190);
  });

  it('is symmetric', () => {
    const there = getDistanceBetweenTwoPoints(30.2672, -97.7431, 48.8566, 2.3522);
    const back = getDistanceBetweenTwoPoints(48.8566, 2.3522, 30.2672, -97.7431);
    expect(there).toBeCloseTo(back, 6);
  });

  /**
   * updateRenderablePlaces compares this against MILES_FROM_CITY (200), so a
   * result in metres rather than miles would quietly show every place at once.
   */
  it('returns miles, not metres', () => {
    const miles = getDistanceBetweenTwoPoints(30.2672, -97.7431, 32.7767, -96.797);
    expect(miles).toBeLessThan(1000);
  });

  it('handles crossing the antimeridian without blowing up', () => {
    const miles = getDistanceBetweenTwoPoints(0, 179.5, 0, -179.5);
    expect(miles).toBeGreaterThan(0);
    expect(miles).toBeLessThan(100);
  });
});
