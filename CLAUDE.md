# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend for michaeljscully.com — React 19 + TypeScript on Vite 5, with an AWS Amplify Gen 2 backend defined in `amplify/` (auth, AppSync data API, S3 storage). Two views: a photo grid home page and a map-driven travel gallery.

## Commands

```
npm run dev             # vite dev server
npm run build           # tsc (noEmit typecheck) + vite build — this IS the typecheck step
npm run preview         # serve built dist/
npm test                # vitest run
npm run test:watch      # vitest in watch mode
npm run format:check    # prettier --check + eslint over src/, scripts/ and amplify/
npm run format:fix      # prettier --write + eslint --fix
```

The entry point is `src/main.tsx`, referenced from `index.html`.

Tests are Vitest, co-located as `*.test.ts(x)` under `src/` and `scripts/`. The default
environment is `node`; the few that need a DOM opt in per-file with
`// @vitest-environment jsdom`. Coverage is deliberately narrow — the pure logic that has
actually broken: the 4:3 card photo rule, `doPagination`'s token loop, `granularitySwitcher`
and the haversine, and `useWindowHeight`'s listener lifecycle. Views and components are
untested.

Vitest and Vite move together — Vitest's peer range tracks Vite majors, so bumping one means
bumping the other. `vite.config.ts` must import `defineConfig` from `vitest/config` rather
than `vite`; since Vitest 3 the `test` key is no longer merged into Vite's own config type,
and importing from `vite` fails `tsc -p tsconfig.node.json` (which nothing in CI runs, so the
error is easy to miss).

Node is pinned in `.nvmrc`, which CI reads via `node-version-file`. Vite 8 requires
`^20.19.0 || >=22.12.0`.

### CI (`.github/workflows/ci.yml`)

Runs `npm ci`, `format:check`, `test`, then `build` on every push to `main` and every PR.
Amplify's own build only runs `npm run build`, so this workflow is the only thing enforcing
formatting, lint and tests. The build step writes a stub `amplify_outputs.json` first —
`src/main.tsx` imports that file, it is gitignored, and nothing in a typecheck or build reads
its contents.

`SKIP_FORMAT=true` short-circuits both format scripts (`if-env` guard).

Style is enforced by `.prettierrc` (120 col, single quotes incl. JSX, `quoteProps: consistent`, trailing commas). Prettier is pinned to `^2.8.8` — upgrading to Prettier 3 will reformat the whole codebase.

`npm run dev` and `npm run build` both need `amplify_outputs.json` at the repo root (gitignored, produced by `ampx sandbox` / pipeline deploy) and `VITE_MAPBOX_TOKEN` in `.env` or the map renders blank.

### Dependency gotchas

`package.json` carries an `overrides` entry pinning `@opentelemetry/core` to `^2.8.0`. Without it, `@aws-amplify/graphql-api-construct` (nested under `@aws-amplify/backend`) pins an exact `2.0.0` that npm hoists away, omits from the lockfile, and then rejects — `npm ci` fails with `Missing: @opentelemetry/core@2.0.0 from lock file`. Do not remove it without re-testing `npm ci` from a clean checkout.

After any dependency change, verify with a real `npm ci` in a scratch dir (copy `package.json` + `package-lock.json` there). `npm install` succeeding does not mean `npm ci` will — see commit 82bb35d for the same failure mode with `@rollup/rollup-*` platform packages.

### Deploy (Amplify CI, `amplify.yml`)

Backend: `npm ci --cache .npm` then `npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID`. Frontend appends `VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN` to `.env` before `npm run build`; artifact dir is `dist`.

The Amplify app lives in **us-east-2**, not the `us-west-2` default — app id `d3rfdjnjzvbkoy`, branch `main`, auto-build on. Any `aws` or `ampx` command needs `AWS_REGION=us-east-2` or it will report that nothing exists. A push to `main` deploys the backend too, so back a schema change with a template diff against the deployed stack before pushing.

## Architecture

### Data layer

`amplify/data/resource.ts` is the single source of truth. Models: `TravelDestination` → `TravelPlace` → `TravelAlbum` → `TravelPhoto` (a 4-level hierarchy), plus a standalone `HomePhoto`. All use **composite identifiers** — e.g. `TravelPlace` is `[destinationId, placeId]`, `TravelPhoto` is `[albumId, photoId]` — so there is no single `id` field to key off; the client code keys maps by `placeId`.

`TravelPlace` and `TravelDestination` each carry a denormalized `cardPhotoThumbnailSrc`, and `TravelPhoto` has a `travelPhotosByPlaceId` secondary index. Those exist so the travel view never reads the whole photo table — see **Travel view** below.

Authorization is `allow.publicApiKey().to(['read'])` plus `allow.authenticated()` for writes. The key ships in the browser bundle, so it must stay read-only; before that restriction it granted full CRUD and anyone could have deleted every row. The site itself only reads. Writes come from the CLI at `../personal-site-cli`, which goes straight to DynamoDB with AWS credentials and does not pass through AppSync authorization at all.

The API key expires 365 days out and every deploy rolls it forward, so it only bites if the site sits undeployed for a year — which has happened before.

`src/types/*.ts` are pure re-exports of `Schema['ModelName']['type']`. Extend the schema; never hand-roll parallel domain types.

Views call `generateClient<Schema>()` from `aws-amplify/api` directly at module scope — there is no data-access layer. Amplify `.list()` is server-paginated, so collections that can grow use `doPagination()` from [src/utils/backend.ts](src/utils/backend.ts) (loops on `nextToken`). The bare `.list()` calls in `home.tsx` (`limit: 100`) and the `TravelDestination` fetch in `travel.tsx` are deliberate — bounded collections.

### Backend infra — two buckets, do not conflate

- `amplify/storage/resource.ts` defines `photoBucket` via `defineStorage`, `photos/*` read+write for authenticated **and** guest.
- `amplify/backend.ts` additionally hand-rolls a CDK stack (`ImagesStack`) with a separate public-read S3 bucket (`RemovalPolicy.RETAIN`) fronted by a CloudFront distribution. This is what actually serves travel/home images; it is outside `defineStorage`'s management.

### Routing and responsive state

[src/App.tsx](src/App.tsx) builds a `createBrowserRouter` whose single layout route renders `Navigation` plus an `<Outlet />`, with `/`, `/home` → `Home` and `/travel` → `Travel` as children. `Navigation` has to stay inside the router — that is what lets its icons be `Link`s instead of anchors that reload the whole app. `Travel` is a `React.lazy` import behind a `Suspense` boundary, which keeps mapbox-gl (1.8 MB, 522 kB gzipped) off the home page.

There is no CSS breakpoint system. `App` computes a `mediaQueries: Record<Orientation, Partial<Record<BreakpointKeys, boolean>>>` object from MUI `useMediaQuery` calls against the width/height tables in [src/utils/display.ts](src/utils/display.ts), and prop-drills it into every component that needs responsive behavior. Adding a breakpoint means editing `display.ts` **and** the hook block in `App.tsx` (the hooks are unconditional by necessity — keep them that way).

Window height comes from the `useWindowHeight` hook in [src/utils/useWindowHeight.ts](src/utils/useWindowHeight.ts), which registers one listener in a `useEffect` and removes it on unmount. Both `App.tsx` and `travel.tsx` previously called `addEventListener` in the render body with no cleanup, adding a listener per render — do not go back to that.

### Travel view

[src/views/travel.tsx](src/views/travel.tsx) is the complex piece — a two-column `Paper` grid (map | card gallery, collapsing to `0 1fr` below the width `sm` breakpoint) plus two overlays.

Fetch pipeline: two `useEffect`s (both `[]`-deps) load destinations and places, and that is the whole initial load — 5 GraphQL requests. Card images come from the denormalized `cardPhotoThumbnailSrc` on each row, falling back to the `noImages` placeholder in `src/utils/images.ts`. A place's photos are fetched **only when its gallery is opened**, through the `travelPhotosByPlaceId` index.

This replaced a pipeline that drained the entire `TravelPhoto` table (around 10k rows, ~100 sequential requests) on every visit just to pick one representative image per card. Do not reintroduce a table-wide photo read.

The rule choosing the representative photo lives in [scripts/cardPhotoRule.ts](scripts/cardPhotoRule.ts): nearest to 4:3, **lowest `photoId` breaking a tie**. The tie-break is load-bearing, not cosmetic — most of the library is exactly 4:3, so without it the winner depended on row arrival order and the choice was not idempotent. The CLI reimplements the same rule in `closest_to_four_thirds`; the two must agree or a backfill re-run churns every row.

Map granularity is the central UI concept: [src/utils/mapping.ts](src/utils/mapping.ts) defines `GRANULARITIES.DESTINATIONS` vs `.PLACES`, switching at zoom `GRANULARITY_CUTOFF` (10). `granularitySwitcher(granularity, dest, place)` is used everywhere to pick between the destination and place variant — of data, of handlers, of render logic. `updateRenderablePlaces` finds the destination nearest the map center via haversine (`getDistanceBetweenTwoPoints`) and shows its places only within `MILES_FROM_CITY` (200).

Components: [map.tsx](src/components/map.tsx) (react-map-gl / MapBox-GL) → [marker.tsx](src/components/marker.tsx) (custom SVG pin, color randomized once into state so it survives re-render; z-index derived from latitude so southern pins sit on top); [cardGallery.tsx](src/components/cardGallery.tsx) (hover a card → `flyTo`, click a destination → zoom past the cutoff, click a place → open gallery); [imageGallery.tsx](src/components/imageGallery.tsx) (MUI `Modal` + `RowsPhotoAlbum` of thumbnails, with a spinner while that place's photos are fetched); [imageViewer.tsx](src/components/imageViewer.tsx) (`react-viewer` full-size lightbox). Gallery and viewer are mutually exclusive — `toggleViewer` swaps them.

Mapbox CSS is loaded from a CDN `<link>` in `index.html`, not imported.
