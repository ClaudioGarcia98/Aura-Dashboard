# Remediation and verification

Implemented 16 October 2026 following the [original audit](PROJECT_AUDIT.md). This document describes the resulting behavior; the original audit remains a historical baseline.

## Changes

| Audit area | Implemented remediation |
| --- | --- |
| Settings import and hydration | Shared field allowlist and schema, current-version hydration validation, safe defaults for invalid cached state, strict versioned backups, atomic imports, size limits, safe URL schemes, and preserved zero volume. Imported JSON cannot replace store actions. |
| Reset and storage | Aura-only reset, deletion failures reported, guarded reads/writes with in-memory continuation. Other origin storage, caches, and service workers are untouched. |
| Watching lists | Complete paginated JSON lists precede RSS fallback; partial activity and stale saved lists are labeled; valid empty lists are accepted; owner-only snapshot merging and the personal bundled snapshot are removed. |
| Schedules | Actual local-midnight calculations handle 23/25-hour days, provider IDs are separated, both providers paginate, Jikan timestamps are normalized into a Portugal-local day, and ordering uses absolute timestamps. Invalid cache shapes recover safely. |
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

- Full test suite: **505 passing tests in 42 files**, up from 447 tests. New regressions cover malformed/current-version backups, action overwrite attempts, denied storage, quota errors, scoped reset, DST, provider pagination, empty authoritative lists, partial RSS, identity collisions, reordered responses, weather response failures, history navigation/replay, YouTube source isolation/playback feedback, drag/background cleanup, focus, tabs, and player continuity across layout changes.
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

### MAL connection and Privacy & Motion follow-up

The public MAL JSON list and the local preview proxy both returned a valid complete watching list. The local proxy took approximately **15.5 seconds**, exceeding the former six-second client deadline and causing an unnecessary RSS fallback. Local/custom full-list requests now allow 25 seconds; public full-list proxies allow 15 seconds per page. Cancellation and provider fallback remain enabled.

Partial memory results expire after 30 seconds rather than five minutes. Settings includes an explicit retry/refresh action that bypasses memory caches. A partial activity feed no longer overwrites a previously saved complete list. Loading feedback starts as soon as a refresh is requested. The production browser displayed **“Connected · Full watching list synced”** on initial load and after using the refresh control.

Privacy & Motion now uses two consistently styled rows with icons, accessible switches, explanatory text, visible state labels, keyboard focus, and reduced-motion styling. Preferences retain their existing defaults and behavior. Checked the layout at desktop size and at 390 × 844. Screenshots: [desktop settings](verification/privacy-motion-desktop.jpg), [phone settings](verification/privacy-motion-mobile.jpg).

Nine additional tests cover slow full-list requests (including a 16-second local response), forced retries, partial-cache expiry, preservation of complete saved lists, status controls, and privacy/motion switches. Full tests, lint, and production build pass. Static hosted copies still depend on third-party proxies; this change does not guarantee provider uptime or grant access to private lists.

### Dedicated multi-user MAL Worker

GitHub Pages reproduced the partial-list failure: unlike local preview, it has no Vite proxy, and all three public full-list proxies timed out. Added the self-contained `workers/mal/worker.js` and configured the hosted dashboard to use `https://aura-mal-api.claudio091998.workers.dev` before public fallbacks. The Worker handles arbitrary public usernames, validates requests, restricts upstream destinations and redirects, validates results, and caches successful pages separately by username/offset for five minutes. There is no preconfigured username list or scheduled personal-data publishing.

The updated suite passes **527 tests across 43 files**, including 22 additional Worker/hosted-client cases for origin/method/path restrictions, cache isolation, pagination, empty lists, malformed upstream responses, failures, and the Hello World placeholder. Lint and production artifact checks also pass. The user must replace the deployed Hello World source with the tested Worker source; live MAL availability and the updated GitHub Pages deployment remain to be verified before calling the hosted issue resolved. Setup is documented in `workers/mal/README.md`.

The first public Worker deployment returned a successful health check but a 502 for a real watching-list request. Removed reliance on incoming `Request.signal`, which Cloudflare gates behind a compatibility flag, and replaced it with a standalone timeout controller. Worker health version is now 2. Added regressions for a runtime without that property and an aborted upstream deadline. **529 tests pass**; lint passes. Live version 2 deployment and real upstream validation remain pending.

Public version 2 was subsequently verified, but the real MAL lookup still returned 502 immediately. The request-signal compatibility change alone did not resolve production. Version 3 distinguishes an upstream redirect, non-JSON response, network failure, and timeout; it logs the underlying connection error without returning internal exception details to visitors. Redirects are inspected but never followed. **531 tests pass**, with lint/build passing. The connected Cloudflare editor stalled with an empty embedded editor and disabled Deploy control after a reload, so version 3 still requires user deployment. No dashboard update has been committed, pushed, or published during this Worker setup; live resolution remains unverified.

After the user deployed version 3, the public health check confirmed that version and a real request for `claclo98` returned **HTTP 200 with 14 valid watching entries**, including the correct `Access-Control-Allow-Origin` for the GitHub Pages site. The Worker endpoint is now live and serving the full list. The dashboard connection is ready for publication and an end-to-end hosted browser check.

## Practical limits and optional follow-up

Real YouTube audio playback, every live MAL proxy, physical touch/pen gestures, browser permission prompts, and direct `file:` behavior across browsers were not exhaustively tested. Provider restrictions, autoplay rules, and suggestion CORS availability can still prevent remote features; the application now handles unavailable/partial/stale results explicitly. No deployment was performed.

During the MAL follow-up, the [Jikan maintainers’ notice](https://github.com/jikan-me/jikan-rest/issues/613) confirmed that their public API was discontinued on 1 October 2026. The primary AniList schedule provider still worked in the browser, but the configured public Jikan schedule fallback needs replacement or a maintained private instance. The deterministic Jikan fixtures validate the adapter’s behavior, not availability of that discontinued service. This is an outstanding provider-maintenance task.

The original high-resolution logo and default video remain unchanged and account for most of the approximately 4.5 MB portable file. Asset recompression or a lighter default background would be a separate performance improvement. Further presentational extractions are optional; they are not prerequisites for the fixes above. A backend migration or full rewrite is not needed for this work.
