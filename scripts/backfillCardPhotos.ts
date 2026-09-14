/**
 * One-off backfill for TravelPlace.cardPhotoThumbnailSrc and
 * TravelDestination.cardPhotoThumbnailSrc.
 *
 * The travel view used to page through the whole TravelPhoto table on every
 * visit just to pick one representative image per card. Those choices are now
 * stored on the place and destination rows; this script computes them from the
 * photos that already exist.
 *
 * Dry run (default):  npx tsx scripts/backfillCardPhotos.ts
 * Apply:              npx tsx scripts/backfillCardPhotos.ts --apply
 *
 * Requires amplify_outputs.json at the repo root.
 */
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { readFileSync } from 'node:fs';
import type { Schema } from '../amplify/data/resource';

const outputs = JSON.parse(readFileSync(new URL('../amplify_outputs.json', import.meta.url), 'utf-8'));
Amplify.configure(outputs);
const client = generateClient<Schema>();

const APPLY = process.argv.includes('--apply');
const DESIRED_RATIO = 4 / 3;

type Photo = { placeId: string; thumbnailSrc: string; width: string; height: string };

async function drain<T>(
  list: (page: { nextToken?: string | null }) => Promise<{ data: T[]; nextToken?: string | null }>,
) {
  let nextToken: string | undefined | null;
  const all: T[] = [];
  do {
    const resp = await list({ nextToken });
    all.push(...resp.data);
    nextToken = resp.nextToken;
  } while (nextToken);
  return all;
}

/** Closest to 4:3 wins — the same rule the client used to apply at runtime. */
function closestToFourThirds<T extends { width: string; height: string }>(photos: T[]): T | undefined {
  return [...photos].sort((a, b) => {
    const aRatio = parseFloat(a.width) / parseFloat(a.height);
    const bRatio = parseFloat(b.width) / parseFloat(b.height);
    if (aRatio === bRatio) return 0;
    return Math.abs(DESIRED_RATIO - aRatio) < Math.abs(DESIRED_RATIO - bRatio) ? -1 : 1;
  })[0];
}

async function main() {
  console.log(APPLY ? 'MODE: APPLY (will write)' : 'MODE: DRY RUN (no writes)');

  const [photos, places, destinations] = await Promise.all([
    drain<Photo>((page) => client.models.TravelPhoto.list(page) as never),
    drain((page) => client.models.TravelPlace.list(page)),
    drain((page) => client.models.TravelDestination.list(page)),
  ]);
  console.log(`fetched ${photos.length} photos, ${places.length} places, ${destinations.length} destinations`);

  const photosByPlace = new Map<string, Photo[]>();
  for (const photo of photos) {
    const list = photosByPlace.get(photo.placeId) ?? [];
    list.push(photo);
    photosByPlace.set(photo.placeId, list);
  }

  // Place cards: best photo belonging to that place.
  const placeCard = new Map<string, string>();
  let placesWithout = 0;
  for (const place of places) {
    const best = closestToFourThirds(photosByPlace.get(place.placeId) ?? []);
    if (!best) {
      placesWithout++;
      continue;
    }
    placeCard.set(place.placeId, best.thumbnailSrc);
  }

  // Destination cards: best among the chosen photos of that destination's places.
  // NB: a destination's places are those whose destinationId equals the
  // destination's *placeId* field, which is how the client keys them too.
  const destinationCard = new Map<string, string>();
  let destinationsWithout = 0;
  for (const destination of destinations) {
    const candidates = places
      .filter((place) => place.destinationId === destination.placeId)
      .flatMap((place) => {
        const best = closestToFourThirds(photosByPlace.get(place.placeId) ?? []);
        return best ? [best] : [];
      });
    const best = closestToFourThirds(candidates);
    if (!best) {
      destinationsWithout++;
      continue;
    }
    destinationCard.set(destination.destinationId, best.thumbnailSrc);
  }

  console.log(`\nplaces      : ${placeCard.size} resolved, ${placesWithout} with no photos`);
  console.log(`destinations: ${destinationCard.size} resolved, ${destinationsWithout} with no photos`);

  const placeChanges = places.filter(
    (p) => placeCard.get(p.placeId) && placeCard.get(p.placeId) !== p.cardPhotoThumbnailSrc,
  );
  const destChanges = destinations.filter(
    (d) => destinationCard.get(d.destinationId) && destinationCard.get(d.destinationId) !== d.cardPhotoThumbnailSrc,
  );
  console.log(`\nwould write : ${placeChanges.length} places, ${destChanges.length} destinations`);

  for (const place of placeChanges.slice(0, 3)) {
    console.log(`  e.g. place ${place.name} -> ${placeCard.get(place.placeId)?.slice(0, 80)}`);
  }

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply to write.');
    return;
  }

  let written = 0;
  for (const place of placeChanges) {
    const resp = await client.models.TravelPlace.update({
      destinationId: place.destinationId,
      placeId: place.placeId,
      cardPhotoThumbnailSrc: placeCard.get(place.placeId),
    });
    if (resp.errors) throw new Error(`place ${place.placeId}: ${JSON.stringify(resp.errors)}`);
    if (++written % 50 === 0) console.log(`  ...${written}/${placeChanges.length} places`);
  }
  console.log(`wrote ${written} places`);

  written = 0;
  for (const destination of destChanges) {
    const resp = await client.models.TravelDestination.update({
      destinationId: destination.destinationId,
      cardPhotoThumbnailSrc: destinationCard.get(destination.destinationId),
    });
    if (resp.errors) throw new Error(`destination ${destination.destinationId}: ${JSON.stringify(resp.errors)}`);
    written++;
  }
  console.log(`wrote ${written} destinations`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
