# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend for michaeljscully.com — React 19 + TypeScript on Vite 5, with an AWS Amplify Gen 2 backend defined in `amplify/` (auth, AppSync data API, S3 storage). Two views: a photo grid home page and a map-driven travel gallery.

## Commands

```
npm run dev             # vite dev server
npm run build           # tsc (noEmit typecheck) + vite build — this IS the typecheck step
npm run preview         # serve built dist/
npm run format:check    # prettier --check + eslint over src/ and amplify/
npm run format:fix      # prettier --write + eslint --fix
```

No test suite. `src/setupTests.js`, `src/reportWebVitals.js` and `src/react-app-env.d.ts` are dead CRA leftovers. The entry point is `src/main.tsx`, referenced from `index.html`.

`SKIP_FORMAT=true` short-circuits both format scripts (`if-env` guard).

Style is enforced by `.prettierrc` (120 col, single quotes incl. JSX, `quoteProps: consistent`, trailing commas). Prettier is pinned to `^2.8.8` — upgrading to Prettier 3 will reformat the whole codebase.

`npm run dev` and `npm run build` both need `amplify_outputs.json` at the repo root (gitignored, produced by `ampx sandbox` / pipeline deploy) and `VITE_MAPBOX_TOKEN` in `.env` or the map renders blank.

### Dependency gotchas

`package.json` carries an `overrides` entry pinning `@opentelemetry/core` to `^2.8.0`. Without it, `@aws-amplify/graphql-api-construct` (nested under `@aws-amplify/backend`) pins an exact `2.0.0` that npm hoists away, omits from the lockfile, and then rejects — `npm ci` fails with `Missing: @opentelemetry/core@2.0.0 from lock file`. Do not remove it without re-testing `npm ci` from a clean checkout.

After any dependency change, verify with a real `npm ci` in a scratch dir (copy `package.json` + `package-lock.json` there). `npm install` succeeding does not mean `npm ci` will — see commit 82bb35d for the same failure mode with `@rollup/rollup-*` platform packages.

`"node": "^22.16.0"` sits in `dependencies` — it installs a Node binary into `node_modules` and is almost certainly unintended.

### Deploy (Amplify CI, `amplify.yml`)

Backend: `npm ci --force` then `npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID`. Frontend appends `VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN` to `.env` before `npm run build`; artifact dir is `dist`.

## Architecture

### Data layer

`amplify/data/resource.ts` is the single source of truth. Models: `TravelDestination` → `TravelPlace` → `TravelAlbum` → `TravelPhoto` (a 4-level hierarchy), plus a standalone `HomePhoto`. All use **composite identifiers** — e.g. `TravelPlace` is `[destinationId, placeId]`, `TravelPhoto` is `[albumId, photoId]` — so there is no single `id` field to key off; the client code keys maps by `placeId`.

Authorization is `allow.publicApiKey()` across the board (365-day key). This is a public, read-mostly personal site — not multi-tenant. The Cognito auth resource exists but no view uses it.

`src/types/*.ts` are pure re-exports of `Schema['ModelName']['type']`. Extend the schema; never hand-roll parallel domain types.

Views call `generateClient<Schema>()` from `aws-amplify/api` directly at module scope — there is no data-access layer. Amplify `.list()` is server-paginated, so collections that can grow use `doPagination()` from [src/utils/backend.ts](src/utils/backend.ts) (loops on `nextToken`). The bare `.list()` calls in `home.tsx` (`limit: 100`) and the `TravelDestination` fetch in `travel.tsx` are deliberate — bounded collections.

### Backend infra — two buckets, do not conflate

- `amplify/storage/resource.ts` defines `photoBucket` via `defineStorage`, `photos/*` read+write for authenticated **and** guest.
- `amplify/backend.ts` additionally hand-rolls a CDK stack (`ImagesStack`) with a separate public-read S3 bucket (`RemovalPolicy.RETAIN`) fronted by a CloudFront distribution. This is what actually serves travel/home images; it is outside `defineStorage`'s management.

### Routing and responsive state

[src/App.tsx](src/App.tsx) builds a `createBrowserRouter` with `/`, `/home` → `Home` and `/travel` → `Travel`, renders `Navigation` above the `RouterProvider`, and sizes the content div from `window.innerHeight` minus a computed nav height.

There is no CSS breakpoint system. `App` computes a `mediaQueries: Record<Orientation, Partial<Record<BreakpointKeys, boolean>>>` object from MUI `useMediaQuery` calls against the width/height tables in [src/utils/display.ts](src/utils/display.ts), and prop-drills it into every component that needs responsive behavior. Adding a breakpoint means editing `display.ts` **and** the hook block in `App.tsx` (the hooks are unconditional by necessity — keep them that way).

Note both `App.tsx` and `travel.tsx` register `window.addEventListener('resize', ...)` inside the render body with no cleanup. Pre-existing; be aware if touching resize behavior.

### Travel view

[src/views/travel.tsx](src/views/travel.tsx) is the complex piece — a two-column `Paper` grid (map | card gallery, collapsing to `0 1fr` below the width `sm` breakpoint) plus two overlays.

Fetch pipeline: four independent `useEffect`s (all `[]`-deps) load destinations, places, photos, and albums, then a fifth derives `destinationCardPhotos` from `[destinations, places, photos]`. Photos are fetched **once, in full** and grouped client-side into `Record<placeId, TravelPhoto[]>` — never queried per place. `rankBestCardPhotos` sorts each group by closeness to a 4:3 aspect ratio; index `[0]` becomes the representative card image (`noImages` placeholder from `src/utils/images.ts` when a place has none).

Map granularity is the central UI concept: [src/utils/mapping.ts](src/utils/mapping.ts) defines `GRANULARITIES.DESTINATIONS` vs `.PLACES`, switching at zoom `GRANULARITY_CUTOFF` (10). `granularitySwitcher(granularity, dest, place)` is used everywhere to pick between the destination and place variant — of data, of handlers, of render logic. `updateRenderablePlaces` finds the destination nearest the map center via haversine (`getDistanceBetweenTwoPoints`) and shows its places only within `MILES_FROM_CITY` (200).

Components: [map.tsx](src/components/map.tsx) (react-map-gl / MapBox-GL) → [marker.tsx](src/components/marker.tsx) (custom SVG pin, color randomized once into state so it survives re-render; z-index derived from latitude so southern pins sit on top); [cardGallery.tsx](src/components/cardGallery.tsx) (hover a card → `flyTo`, click a destination → zoom past the cutoff, click a place → open gallery); [imageGallery.tsx](src/components/imageGallery.tsx) (MUI `Modal` + `RowsPhotoAlbum` of thumbnails); [imageViewer.tsx](src/components/imageViewer.tsx) (`react-viewer` full-size lightbox). Gallery and viewer are mutually exclusive — `toggleViewer` swaps them.

Mapbox CSS is loaded from a CDN `<link>` in `index.html`, not imported.
