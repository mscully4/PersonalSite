# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal site frontend (michaeljscully.com), React + TypeScript, built with Vite. Backend is AWS Amplify Gen 2 (auth, data/AppSync API, S3 storage), defined in `amplify/`.

## Commands

```
npm run dev            # vite dev server
npm run build           # tsc typecheck + vite build
npm run preview         # preview built dist
npm run format:check    # prettier --check + eslint over src/ and amplify/
npm run format:fix      # prettier --write + eslint --fix over src/ and amplify/
```

No test suite exists (`src/setupTests.js` is a leftover CRA artifact, unused).

`npm run build` runs `tsc` first with `noEmit` — this is the type-check step; there is no separate `tsc --noEmit` script.

Amplify backend deploy (CI, via `amplify.yml`): `npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID`. Frontend build injects `VITE_MAPBOX_TOKEN` into `.env` before `npm run build`.

## Architecture

**Routing**: `src/App.tsx` sets up a `BrowserRouter` with three routes (`/`, `/home`, `/travel`) rendering `src/views/home.tsx` and `src/views/travel.tsx`. `App.tsx` also computes responsive breakpoint state (`mediaQueries`, keyed by `Orientation.WIDTH`/`HEIGHT` × `BreakpointKeys.sm/md/lg` from `src/utils/display.ts`) and passes it down to views/components that need responsive behavior — there is no CSS-only breakpoint system, it's all driven through MUI's `useMediaQuery` computed once per render in `App`.

**Amplify data client**: Views call `generateClient<Schema>()` from `aws-amplify/api` directly (see `src/views/home.tsx`, `src/views/travel.tsx`) — no data-access abstraction layer. `Schema` comes from `amplify/data/resource.ts`, which is the single source of truth for all models (`TravelDestination`, `TravelPlace`, `TravelAlbum`, `TravelPhoto`, `HomePhoto`) and their relationships. Domain types in `src/types/travel.ts` are just re-exports of `Schema['ModelName']['type']` — don't hand-roll parallel types, extend the schema instead.

Amplify list queries are paginated server-side; use `doPagination()` from `src/utils/backend.ts` to fetch full collections (loops `model.list({ nextToken })` until exhausted). Direct unpaginated `.list()` calls (as in `home.tsx` and the `TravelDestination` fetch in `travel.tsx`) are intentional — small/bounded collections.

**Travel view** (`src/views/travel.tsx`) is the most complex piece: it's a map + gallery UI over a 4-level data hierarchy (`TravelDestination` → `TravelPlace` → `TravelAlbum` → `TravelPhoto`, all keyed by composite identifiers, e.g. `TravelPlace` is identified by `[destinationId, placeId]`). Key pieces:
- `src/components/map.tsx` (MapBox-GL via `react-map-gl`) renders destinations or places depending on zoom, switching via `mapGranularity` (`GRANULARITIES.DESTINATIONS` vs `.PLACES`, threshold `GRANULARITY_CUTOFF` in `src/utils/mapping.ts`).
- `src/components/cardGallery.tsx`, `imageGallery.tsx`, `imageViewer.tsx` render the photo browsing UI alongside the map.
- Photos are fetched once and indexed into `Record<placeId, TravelPhoto[]>` / `Record<destinationId, TravelPhoto>` maps client-side (not queried per-place) — see the `useEffect` chain in `travel.tsx` for the fetch → group → rank pipeline (`rankBestCardPhotos` picks the photo closest to a 4:3 aspect ratio as the representative card image).

**Backend infra** (`amplify/backend.ts`): beyond the standard `defineBackend({ auth, data, photoBucket })`, it hand-adds a CDK stack (`ImagesStack`) with a public-read S3 bucket + CloudFront distribution for serving travel images — this isn't managed through `amplify/storage/resource.ts`'s `defineStorage` (that one is a separate authenticated/guest-writable bucket named `photoBucket`). Don't conflate the two buckets.

Authorization is API-key based (`allow.publicApiKey()` in `amplify/data/resource.ts`), not per-user — this is a public read-mostly personal site, not a multi-tenant app.
