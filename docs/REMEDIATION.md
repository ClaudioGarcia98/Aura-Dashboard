# Remediation and verification

Implemented 16 October 2026 following the [original audit](PROJECT_AUDIT.md). This document describes the resulting behavior; the original audit remains a historical baseline.

## Changes

| Audit area | Implemented remediation |
| --- | --- |
| Settings import and hydration | Shared field allowlist and schema, current-version hydration validation, safe defaults for invalid cached state, strict versioned backups, atomic imports, size limits, safe URL schemes, and preserved zero volume. Imported JSON cannot replace store actions. |
| Reset and storage | Aura-only reset, deletion failures reported, guarded reads/writes with in-memory continuation. Other origin storage, caches, and service workers are untouched. |
| Watching lists | Complete paginated JSON lists via the local Vite proxy (`/api/mal`) in local dev/preview or the dedicated Cloudflare Worker (`MAL_RELAY_BASE`) in production. Legacy partial RSS caches and `dash_mal_proxy` overrides are rejected/cleaned up; saved complete lists are validated, keyed per user (up to 5 recent users), and labeled with their saved timestamp when served stale; valid empty lists are accepted. |
| Schedules | Actual local-midnight calculations handle 23/25-hour days, AniList GraphQL paginates and separates provider IDs (`anilist_id` vs `mal_id`), ordering uses absolute timestamps, and the discontinued Jikan fallback has been removed in favor of cached matching-day schedules with explicit stale UI banners. Invalid cache shapes recover safely. |
| Requests | A shared deadline/cancellation helper covers response bodies as well as fetch. Schedule and watching loads are independent. User/unit/city changes invalidate obsolete results before UI or cache writes. |
| Weather | Unit/location-aware caches, validated responses, stale data visible in production, correct snow-shower/overcast icons, location-source metadata, zero-coordinate support, and location-local sunrise/sunset formatting. Weather rendering, icons, service, and lifecycle are separated. |
| Media lifecycle | Late background loads are ignored, replaced background object URLs are revoked, drag listeners detach on unmount, and IndexedDB abort/deletion failures settle correctly. The radio stays mounted above responsive layout changes. |
| Search and security | Data-only, debounced and cancellable suggestions replace JSONP; suggestions are opt-in. Keyboard history navigation and stored-URL replay are corrected. Popup URLs are validated and use noopener/noreferrer. YouTube messages validate their iframe source and origin. Playback is confirmed by the iframe, with timeout/error feedback. |
| Accessibility | Settings/reset dialogs trap and restore focus, account for visibility transitions, and close with Escape. Tabs support arrow/Home/End keys and linked panels. Bookmark/station controls offer keyboard reordering. Closed details and drawers are removed from keyboard/accessibility interaction. Background video respects reduced motion and has a pause setting. |
| Production packaging | Offline builds with no source mutation, one verified HTML artifact including runtime image URLs, a script-hash CSP, output/size checks, and deployment of the exact validated artifact. CI concurrency is scoped by ref and deployment permissions are limited to its job. |
| Dependencies | Removed `vite-plugin-singlefile` and its vulnerable micromatch/braces chain; the application-specific packager is small local code with artifact checks. |
| Legacy material | Removed unused personal MAL snapshot/synchronization code and the obsolete manual coverage checklist. Preserved the old architecture proposal under `docs/archive` with a historical label. README and project guidance now describe actual commands, storage/privacy behavior, runtime requirements, and the proprietary license. |

## Structure

The existing component/hook/service/store layers remain. Cohesive extractions reduced the largest mixed-responsibility modules:

| Module | Before | After |
| --- | ---: | ---: |
| SettingsPanel composition | 555 lines | 306 lines, with weather, bookmarks, privacy, and background sections extracted |
| WeatherWidget | 548 | 238, with service, hook, and icons extracted |
| animeService | 541 | 5-line public boundary over schedule, watching, parser, and time modules |
| useAnimeSchedule | 410 | 277, with watching synchronization extracted |
| SearchBox | 440 | 351, with suggestions and engine definitions extracted |
| MediaSettings | 372 | 265, with background controls extracted |

Anime and settings styles are divided into smaller ordered stylesheets while preserving the cascade. Existing supported legacy settings readers remain; they were not deleted merely because their keys are old.

## Automated verification

- Current test suite: **525 passing tests in 43 files** (up from 447 at initial audit and 505 after initial remediation). Regressions cover malformed/current-version backups, action overwrite attempts, denied storage, quota errors, scoped reset, DST, provider pagination, empty authoritative lists, partial cache rejection, multi-user saved watching lists, identity collisions, reordered responses, rate-limit/unavailable status differentiation, stale schedule banners, Worker rate limiting/body bounds/in-flight coalescing, weather response failures, history navigation/replay, YouTube source isolation/playback feedback, drag/background cleanup, focus, tabs, and player continuity across layout changes.
- `npm run lint`: passes.
- `npm run build`: passes; produces only `dist/index.html`, below the 5 MB budget. The checker verifies the final inline script hashes and rejects leftover runtime asset URLs as well as external local files.
- `npm audit --json`: zero reported vulnerabilities after removing the affected dependency chain.
- `npm ls --depth=0`: dependency tree resolves successfully.
- `git diff --check`: no whitespace errors after cleanup.

Tests use deterministic provider fixtures for failure and race conditions. Live-provider availability is not used as a CI pass condition. Checks ran on Windows with Node 24.16.0; the workflow targets Node 22, with the documented minimum 22.12.0.

## Browser verification

The production build was served locally and checked in the in-app browser at desktop size, phone portrait (390 × 844), and short landscape (667 × 375).

- Confirmed the dashboard boots and loads current weather and anime data.
- Found and corrected a runtime logo reference that a successful bundle alone had missed. Confirmed the logo subsequently decoded from an embedded data URI.
- Changed a temporary display name, reloaded, confirmed persistence, and restored the original value.
- Added a temporary bookmark, reloaded, confirmed its exact stored destination, and removed the test bookmark.
- Checked compact Home, Settings, and Lofi navigation and the dedicated player view.
- Checked settings open/Escape close and focus restoration; transition-aware focus handling was added following the browser check.
- Checked the pause-background setting against the video element: autoplay became false and playback was paused, then the original setting was restored.
- No application console errors were observed in the checked production views.

Screenshots: [desktop](verification/desktop.jpg), [phone](verification/mobile.jpg), and [landscape](verification/landscape.jpg).

### MAL connection, Privacy & Motion, and Dedicated Worker (historical progression)

1. **Initial timeout & Privacy UI**: Local/custom full-list deadlines were raised to 25s after observing ~15.5s local responses, and Privacy & Motion switches were restyled and verified at desktop and 390 × 844 sizes ([desktop settings](verification/privacy-motion-desktop.jpg), [phone settings](verification/privacy-motion-mobile.jpg)).
2. **Dedicated multi-user MAL Worker (v1–v3)**: GitHub Pages reproduced third-party proxy timeouts, motivating `workers/mal/worker.js` (`https://aura-mal-api.claudio091998.workers.dev`). After replacing `Request.signal` reliance (v2) and hardening redirect/error diagnostics (v3), live deployment was verified with HTTP 200 and 14 watching entries for `claclo98`.
3. **Final simplification & hardening (R01–R09, R13)**:
   - Removed all third-party CORS proxies (`AllOrigins`, `CodeTabs`), RSS-to-JSON fallbacks (`RSS2JSON`, `Feed2JSON`), `dash_mal_proxy`, and the discontinued Jikan schedule fallback (`https://github.com/jikan-me/jikan-rest/issues/613`).
   - Watching lists now use only the local Vite proxy (`/api/mal`, 25s timeout) on `localhost`/`127.0.0.1` and the Cloudflare Worker (`MAL_RELAY_BASE`, 30s timeout) in production.
   - Legacy `partial: true` watching caches are rejected and removed; complete saved lists are validated and stored per username (up to 5 recent users) with saved-timestamp display and distinct `rate_limited` / `unavailable` / `stale` / `error` statuses.
   - Fixed `useWatchingList` so incrementing `refreshKey` forces a network fetch only on the refresh trigger rather than disabling the 5-minute memory cache on subsequent renders.
   - Added non-enumerable `stale`/`savedAt` metadata to cached schedule fallbacks and wired stale schedule indicators into `TodayLaunch`, `Sidebar`, and `EmbeddedAnimeList`.
   - Hardened `workers/mal/worker.js` with optional Cloudflare `RATE_LIMITER` binding support + per-IP sliding-window fallback (`30 req/min`), 1 MB streaming upstream body limits, strict field/duplicate validation, in-flight cache-miss coalescing, and reproducible `workers/mal/wrangler.toml` configuration.

## Practical limits and optional follow-up

Real YouTube audio playback, physical touch/pen gestures, browser permission prompts, and direct `file:` behavior across browsers were not exhaustively tested. Provider restrictions, autoplay rules, and suggestion CORS availability can still prevent remote features; the application handles unavailable and stale results explicitly.

The original high-resolution logo and default video remain unchanged and account for most of the approximately 4.5 MB portable file. Asset recompression or a lighter default background would be a separate performance improvement. Further presentational extractions are optional; they are not prerequisites for the fixes above.
