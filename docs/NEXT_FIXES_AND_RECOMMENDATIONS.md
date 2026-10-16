# Aura: remaining fixes and recommendations

Updated: 16 October 2026

**Implementation update:** R01, R02, R03, R04, R05, R07, R08, R09 (unit/coalescing), and R13 have been implemented and verified across the codebase (`525 passing tests in 43 files`, `npm run lint`, and `npm run build`). Remaining items in R06 (live post-deploy Worker v4 verification), R10 (optional headless browser suite), R11 (optional asset recompression), and R12 (optional further component splitting) remain available as future enhancements.

## Current verified baseline

- Dashboard MAL & AniList simplification, cache migration, stale schedule indicators, and Worker v4 hardening are implemented and verified locally (`525 tests in 43 files`).
- Cloudflare Worker version 3 is currently live at `https://aura-mal-api.claudio091998.workers.dev`; `workers/mal/worker.js` and `workers/mal/wrangler.toml` are ready for reproducible deployment via `npx wrangler deploy`.
- The dependency audit reports zero vulnerabilities.
- The production application builds into one portable HTML file (`dist/index.html`), approximately 4.5 MB. The Worker is a separately deployed service.

The broad storage, backup, reset, request-race, accessibility, media-lifecycle, and build fixes are preserved. See [the remediation record](REMEDIATION.md) for details.

## Priority overview

| ID | Status | Work | Main benefit |
| --- | --- | --- | --- |
| R01 | Completed | Simplified MAL connections (Vite proxy + Cloudflare Worker only) | Fewer delays, dependencies, and incomplete results |
| R02 | Completed | Migrated old partial caches; multi-user saved-list validation | Prevents old RSS activity from appearing to be a complete list |
| R03 | Completed | Added Worker rate limiting (`RATE_LIMITER` binding + per-IP window) | Reduces abuse and unnecessary upstream traffic |
| R04 | Completed | Removed discontinued Jikan fallback; added stale schedule UI banners | Avoids a retired dependency and labels cached schedules clearly |
| R05 | Completed | Added `workers/mal/wrangler.toml` and deployment instructions | Reproducible Worker configuration and deployment |
| R06 | Ready for live check | Test the real Worker runtime and deployed boundary after `wrangler deploy` | Confirms live edge behavior matches deterministic suite |
| R07 | Completed | Improved errors, retry behavior, `refreshKey` cache fix, and saved timestamp | Makes outages, rate limits, and cached results understandable |
| R08 | Completed | Added 1 MB streaming body limit and normalized field bounds in Worker | Limits resource use and rejects malformed/duplicate upstream data |
| R09 | Completed (code) | Added in-flight cache-miss coalescing and exposed `X-Aura-Cache` / `Retry-After` | Prevents thundering-herd MAL calls under concurrent misses |
| R10 | Optional (P2) | Add headless browser tests and broader compatibility checks | Protects real desktop/mobile behavior automatically |
| R11 | Optional (P3) | Optimize the default logo and video | Reduces initial download and decoding cost |
| R12 | Optional (P3) | Continue selected file and test extractions | Makes future changes easier to review |
| R13 | Completed | Reconciled documentation (`README.md`, `CLAUDE.md`, `REMEDIATION.md`, Worker docs) | Removes contradictory setup and progress descriptions |

## R01 — Simplify the MAL connection flow (Completed)

**Final flow:**

```text
Local development: local Vite proxy (/api/mal) → matching saved complete list on failure
Hosted application: dedicated Worker (MAL_RELAY_BASE) → matching saved complete list on failure
No matching saved complete list: clear error + Retry
```

- [x] Keep the local Vite proxy in `vite.config.js`.
- [x] Keep the dedicated Worker and multi-user pagination.
- [x] Keep normalized username identity, cancellation, bounded requests, verified empty lists, and replacement of successful results.
- [x] Remove the `dash_mal_proxy` read and custom-proxy branch after checking its remaining references.
- [x] Remove the AllOrigins `/get` and `/raw` and CodeTabs watching-list branches.
- [x] Remove RSS2JSON and Feed2JSON from watching-list synchronization.
- [x] Remove `firstSuccessful` if it has no remaining caller.
- [x] Remove unused provider constants/imports from `src/services/api.js` after checking all callers.
- [x] Remove `parseMALRssItems` and its export after removing its callers.
- [x] Replace obsolete fallback tests with tests for the new Worker/local-proxy contracts, saved data, and errors.
- [x] Update the five-tier description and privacy disclosure.

## R02 — Preserve complete saved lists and migrate partial caches (Completed)

- [x] Reject and discard legacy entries marked `partial: true` and clean up `dash_mal_proxy` in `localStorage`.
- [x] Validate username, timestamp, item shape, positive safe integer MAL identifiers, and duplicate identifiers before reuse.
- [x] Preserve the last complete successful list when a refresh fails.
- [x] Save a successful empty list, replacing an older nonempty list.
- [x] Display the saved list's last successful update time (`malSavedAt`). Do not replace that time merely because a refresh was attempted.
- [x] Keep a bounded collection of complete lists by normalized username (`byUser`, up to 5 users) in `dash_anime_watching_v2`, so switching back to a previous account works during an outage.
- [x] Remove partial-only UI/state logic after the migration and fallback removal are complete.

## R03 — Add Worker rate limiting and quota protection (Completed)

- [x] Support Cloudflare's `RATE_LIMITER` binding (failing closed with 503 if misconfigured) plus a built-in per-IP sliding-window limiter (`30 req/min` per `CF-Connecting-IP`) and record configuration in `workers/mal/wrangler.toml`.
- [x] Return HTTP 429 with `Retry-After: 60` when a limit is exceeded.
- [x] Teach the frontend to respect HTTP 429 (`rate_limited` status) without retrying through removed proxies.
- [x] Test both the `RATE_LIMITER` binding and the per-IP rate limiter explicitly in `workers/mal/worker.test.js`.
- [x] Keep the fixed upstream target, path/query validation, and no-follow redirect behavior.

## R04 — Remove the discontinued Jikan public fallback (Completed)

- [x] Keep AniList as the primary schedule provider.
- [x] Remove calls to the retired public Jikan endpoint (`JIKAN_BASE`, `jikanSchedule`, `parseJikanItem`) and the misleading `getJstDayRange` alias.
- [x] Prefer a matching saved schedule with a visible stale state (`stale: true`, `savedAt`) while AniList is unavailable.
- [x] Carry freshness metadata (`todayStale`, `sidebarStale`) to `TodayLaunch`, `Sidebar`, and `EmbeddedAnimeList` (`"Showing saved schedule · Live update unavailable"`), and update error copy to name AniList accurately.
- [x] Retain the Portugal-local day boundaries, DST behavior, timestamp sorting, and separation of AniList/MAL identifiers.
- [x] Replace retired-provider fixtures with tests of the supported AniList + stale-cache behavior.

## R05 — Make Worker configuration and deployment reproducible (Completed)

- [x] Add `workers/mal/wrangler.toml` with entry point (`worker.js`), compatibility date (`2026-10-01`), allowed origin (`SITE_ORIGIN`), and documented rate-limiting binding template.
- [x] Document the release order, `npx wrangler deploy`, and `npx wrangler rollback` in `workers/mal/README.md`.
- [x] Keep Worker deployment independent from the offline frontend build.

## R06 — Test the actual Worker runtime and deployment boundary

- [x] Cover `Request.signal`-less runtime behavior, aborts during fetch/body reads, redirect handling, cache operations, rate limiting, oversized bodies, and request coalescing in `workers/mal/worker.test.js`.
- [x] Exercise CORS using the production origin, rejected origins, and localhost development.
- [ ] Run post-deploy live check against `https://aura-mal-api.claudio091998.workers.dev` after running `npx wrangler deploy`.

## R07 — Improve errors, retry behavior, and freshness information (Completed)

- [x] Distinguish `rate_limited` (HTTP 429), `unavailable` (HTTP 502 / timeout), `stale` (saved fallback), `error`, and `fresh`.
- [x] Show saved timestamp (`Showing your saved watching list (saved HH:MM)…`) when serving saved data after failure.
- [x] Make refresh semantics explicit in `MalConnectionStatus.jsx` and documentation.
- [x] Prevent repeated button presses while `loading === true`.
- [x] Fix `useWatchingList.js` so `refreshKey` only forces a network bypass when `refreshKey` increments (`prevRefreshRef`), preserving the 5-minute memory cache on subsequent renders.

## R08 — Bound Worker response size and normalized fields (Completed)

- [x] Enforce a 1 MB (`1_048_576` bytes) streaming upstream response-body limit (`readBoundedText`), returning HTTP 502 `UPSTREAM_TOO_LARGE` when exceeded even if `Content-Length` is absent.
- [x] Bound `anime_title` (512 chars) and `anime_image_path` (1024 chars), and validate `anime_score_val` (`0..10` or `'N/A'`) and `num_watched_episodes` (`0..100000`).
- [x] Reject duplicate or malformed `anime_id` values consistently across a page.
- [x] Keep canonical MAL links and the six-field response allowlist.
- [x] Avoid caching redirects, HTML pages, errors, or oversized responses.

## R09 — Verify edge caching and concurrent requests (Completed in code)

- [x] Verify separate cache entries for different normalized usernames and different offsets in unit tests.
- [x] Keep errors out of the successful-data cache.
- [x] Coalesce simultaneous in-flight cache misses (`inflight` Map) for the same username and page within a Worker isolate.
- [x] Expose `X-Aura-Cache` and `Retry-After` headers through `Access-Control-Expose-Headers`.
- [ ] Verify `MISS` → `HIT` on the live Cloudflare edge after deploying the updated Worker.

## R10 — Add browser tests and broader compatibility checks (Optional follow-up)

- [ ] Add a small deterministic browser suite against the production artifact served without Vite's development proxy.
- [ ] Run a controlled browser check against GitHub Pages after releases.

## R11 — Optimize the default assets (Optional follow-up)

- [ ] Measure and optimize the logo, favicon, and default video while preserving the portable single-file contract.

## R12 — Continue only useful structural cleanup (Optional follow-up)

- [ ] Consider optional sub-extractions in `LofiPlayer.jsx`, `SearchBox.jsx`, or `SettingsPanel/index.jsx` only when changing those modules next.

## R13 — Reconcile documentation with the deployed result (Completed)

- [x] Update `docs/REMEDIATION.md` so its current-state summary records the simplified architecture, Worker hardening, and 525-test count.
- [x] Replace the five-tier MAL explanation and remove Jikan references across `README.md`, `CLAUDE.md`, `docs/REMEDIATION.md`, and `workers/mal/README.md`.
- [x] Document which username data is sent to the Worker/MAL and how long caches last.
- [x] Keep README, project guidance, Worker instructions, and `wrangler.toml` consistent.
- [x] Preserve the proprietary-license statement.

## Verification completed for this release

- [x] Full test suite passes (`525 passed` across `43 test files`).
- [x] `npm run lint` passes with zero errors.
- [x] `npm run build` passes and preserves the single-file/security-hash/size checks.
- [x] `git diff --check` passes with no whitespace issues.

This checklist is not a full penetration test or an exhaustive guarantee that no other defects exist. It separates observed gaps from proposed hardening and optional maintenance so the next changes can be reviewed and verified in manageable groups.
