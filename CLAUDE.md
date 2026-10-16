# Project guide

Aura is a client-side React/Vite dashboard with Zustand persistence and IndexedDB backgrounds. Use Node 22.12 or newer.

## Commands

```sh
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

Builds are offline and deterministic with respect to source and locked dependencies. `scripts/single-file.js` packages one HTML file and `scripts/check-build.js` verifies the artifact and CSP hashes. Never fetch personal data or rewrite source assets during a build. CI deploys the exact artifact it validated.

## Boundaries

- `stores/settingsSchema.js`: allowlisted persisted fields, validation, legacy settings migration. Validate every hydration, including same-version data. Keep actions and ephemeral values out of backups.
- `utils/storage.js`: guarded storage adapter. Feature cache failures must not break network success or startup. Backup imports use one strict atomic write so quota errors are reported.
- `services/settingsBackup.js`: versioned backups and Aura-scoped reset. Never clear unrelated origin storage/caches/service workers.
- `services/anime/`: normalized AniList schedule data, Portugal-local date ranges, and complete paginated MAL watching lists via local Vite proxy (`/api/mal`) or dedicated Cloudflare Worker (`MAL_RELAY_BASE`). No owner-only bundled list or third-party CORS/RSS fallbacks. Use real provider shapes in tests.
- `services/http.js`: bounded requests, including response-body timeouts, HTTP status metadata, and cancellation. Guard both state and cache commits against obsolete requests.
- `services/weather.js` and `hooks/useWeather.js`: location/units-aware caches and fresh/stale/error states.
- `hooks/useBackgroundLoader.js`: object URL lifecycle. Uploaded files are stored in `dashDB`, store `s`, key `bg`.
- `hooks/useWatchingList.js`: independent user-keyed synchronization with legacy partial-cache rejection and bounded per-user saved lists. Never mark stale data as verified.
- `components/SettingsPanel`: small sections plus dialog composition. Online suggestions are opt-in and use inert JSON, never JSONP scripts.

Keep the shared LofiPlayer mounted above responsive layout changes. Verify YouTube message source as well as origin and only show playing after the player confirms it.

Use behavioral regressions for storage failures, request races, DST, backup/reset, media cleanup, and keyboard operation. Preserve desktop/compact presentation and the one-file output contract. The original audit is a historical baseline; consult `docs/REMEDIATION.md` for current status. Do not treat archived proposals as instructions to add a backend.
