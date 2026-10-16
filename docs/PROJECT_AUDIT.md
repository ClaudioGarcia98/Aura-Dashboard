# Aura project audit and remediation plan

> Historical baseline. See [remediation and verification](REMEDIATION.md) for the fixes applied after this review.

Reviewed 16 October 2026, against commit `9cd32dd` and the current working tree.

## Assessment

The project has a reasonable foundation: React components, reusable hooks, a small Zustand store, services, linting, tests, and CI already exist. It needs targeted reliability work and several focused extractions. A full rewrite, backend migration, or replacement state manager is not justified by this review.

The most urgent issues are unsafe settings restoration, overly broad reset behavior, startup failures when storage is unavailable, and incorrect anime data handling. File organization is a secondary problem. Fix the behavior and add regression coverage before moving the affected code.

This is an audit and plan. Application source and dependencies were not changed, and no files were deleted. Build verification regenerated ignored `dist/` output.

## Checks performed and limits

| Check | Result |
| --- | --- |
| `npm run lint` | Passed. |
| `npm test` | 36 test files, 447 tests passed. The first sandboxed attempt failed before test collection because temporary-file renames were denied; the unrestricted rerun passed. |
| Production bundling | `node node_modules/vite/bin/vite.js build` passed. Output: 3,203,605-byte HTML plus a separate 489,148-byte PNG. HTML gzip size reported by Vite: 2,208.71 kB. |
| Full package build script | Inspected, but intentionally not executed: it fetches a personal MAL list and overwrites a tracked source asset before bundling. The successful bundler check does not validate this synchronization step. |
| Current dependency audit | `npm audit --json` reported three high-severity package entries from one advisory chain: `vite-plugin-singlefile@2.3.3 → micromatch@4.0.8 → braces@3.0.3`. |
| Focused reproductions | Confirmed invalid persisted state, denied-storage startup failure, a null schedule-cache crash, empty RSS winning over valid MAL data, and an incorrect DST day boundary. Network responses in these probes were mocked. |
| Static inspection | Reviewed application composition, services, hooks, persistence, settings, search, media, responsive layout, tests, workflow, assets, and documentation. No obvious application credential was found in the inspected working-tree source. |

This was not a browser interaction audit, penetration test, full secret-history scan, or uptime check of external providers. Passing unit tests does not demonstrate real YouTube playback, GPS permission flows, touch interaction, or portable `file:` operation. The local runtime was Node 24.16.0; CI specifies Node 22.

## Findings, in priority order

P1 means fix before the next release. P2 means fix in the next reliability iteration. P3 means cleanup or hardening after the core fixes. No confirmed critical remote compromise was established.

### F01 — P1: Imports and hydration accept invalid state and can break the entire dashboard

Evidence: [settings import](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/components/SettingsPanel/index.jsx:147>), [store hydration](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/stores/useSettingsStore.js:80>), and [root render](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/App.jsx:185>).

The importer accepts arbitrary `dash_*` strings, including `dash_settings`, without validating its inner state. Zustand's default merge accepts unknown keys, while the rehydration callback only repairs the top-level `speedDials` array. Same-version payloads bypass `migrate`.

A probe hydrated `{ version: 1, state: { lofiStations: null, customEngines: {}, setUsername: "overwritten" } }`. The resulting store retained all three invalid values. Reading `lofiStations.length`, as the application does, threw an exception. Action names can also be overwritten by imported JSON values. Arrays containing null or malformed elements are not repaired either.

Fix: define an explicit settings schema and allowlisted persisted fields. Apply it on import, legacy migration, and every hydration, including the current version. Validate enums, booleans, strings, item shapes, unique IDs, URL protocols, and volume bounds. Keep actions outside the imported merge. Validate the whole backup before writing anything; report quota/read failures accurately and avoid partial restoration. Add a backup version and reasonable file/item limits.

### F02 — P1: Reset can erase other applications' data on the same origin

Evidence: [reset handler](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/components/SettingsPanel/index.jsx:485>).

Reset calls `localStorage.clear()` and `sessionStorage.clear()`, deletes every Cache Storage cache, and unregisters every accessible service worker. Browser storage is scoped by origin, so another application hosted under a different path on the same domain can lose its data or offline support. This matters for multiple projects hosted beneath one GitHub Pages origin.

Fix: delete only Aura-owned settings, cache keys, and the `dashDB` database. The source currently registers no service worker and creates no Cache Storage cache, so remove those broad cleanup branches. If those features are introduced later, use explicit Aura names and scopes. Test reset with unrelated keys, caches, and registrations present; they must survive.

### F03 — P1: Storage errors can prevent startup and ordinary actions

Evidence: [store initialization](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/stores/useSettingsStore.js:17>), [JSON helpers](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/utils/storage.js:9>), and direct storage access throughout search, weather, and anime hooks.

`safeJsonParse(localStorage.getItem(...))` catches malformed JSON, but cannot catch an exception thrown before the helper is called. Store initialization reads storage at module evaluation time, before any React error boundary can help. A mocked denied-storage read reproduced an import failure. Writes can also interrupt search submission or turn successful API fetches into apparent errors when storage is full.

Fix: introduce a guarded storage adapter with an in-memory fallback; use it for Zustand and feature caches. Separate network success from optional cache-write success. Preserve a legacy saved volume of `0`, which currently becomes `0.2` through `parseFloat(...) || 0.2`. Test denied reads/writes and quota failures. Browsers may deny storage, and behavior for local `file:` URLs is not guaranteed. See [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

### F04 — P1: MAL synchronization can return incomplete data and retain removed shows

Evidence: [provider requests and race](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/services/animeService.js:404>), [owner fallback merge](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/services/animeService.js:480>).

Five fallback requests race through `Promise.any`, which chooses the first fulfilled result even if it is an empty or partial RSS activity list. In a probe, an immediate valid empty RSS response beat a JSON list containing a currently watched show; the final result was `[]`. An RSS activity feed is not equivalent to a complete current-watching list.

For `claclo98`, live results are always unioned with the bundled snapshot. A show removed from the live list therefore remains in the result whenever it exists in that snapshot. The MAL JSON endpoint also only requests `offset=0`; large lists need complete retrieval or an explicit limitation.

Fix: distinguish authoritative lists, partial activity feeds, empty lists, and failures. Prefer a complete authoritative result, replace cached snapshots on success, and use stale data only on failure with a visible stale status. Do not use hardcoded owner-only merge behavior. Add tests for an empty feed followed by a complete list, a genuinely empty authoritative list, removals, and pagination. Reduce unnecessary parallel disclosure of the MAL username to proxy services.

### F05 — P2: Anime schedule boundaries and provider normalization are inconsistent

Evidence: [date range](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/services/animeService.js:75>), [provider pagination](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/services/animeService.js:265>), [Jikan fallback](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/services/animeService.js:336>), and [sidebar sorting](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/hooks/useAnimeSchedule.js:253>).

The range ends at `start + 86400`, but a Lisbon day may be 23 or 25 hours. For 29 March 2026, the probe returned `2026-03-30T00:00:00Z` as the end; the next Lisbon midnight is `2026-03-29T23:00:00Z`. The existing test incorrectly requires every day to be exactly 24 hours.

AniList uses a Portugal-local date range, while Jikan receives the weekday without conversion to the same date/time model. Results are sorted by JST clock text rather than an absolute airing timestamp. Only the first AniList page of 50 entries and the first Jikan page are requested, so larger result sets can be truncated. AniList records without a MAL ID also reuse an AniList ID as `mal_id`, creating potential identity collisions.

Fix: calculate each local midnight independently, normalize provider dates and IDs, use `airingAt` for ordering, and read pagination metadata. Keep the documented Portugal timezone unless changing it is a separate product decision. Replace the misleading `getJstDayRange` alias after updating callers/tests. Test both DST transitions, midnight boundary episodes, missing MAL IDs, and multiple provider pages.

### F06 — P2: Requests can hang, race with newer settings, or persist obsolete results

Evidence: [anime schedule fetching](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/services/animeService.js:252>), [timeout wrapper](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/services/animeService.js:355>), [watching effects](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/hooks/useAnimeSchedule.js:101>), [weather effect](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/components/WeatherWidget.jsx:143>), and [city search](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/components/SettingsPanel/index.jsx:109>).

Schedule fetches have no timeout, and the initial watching refresh waits for the schedule to finish. The MAL timeout races promises without cancelling requests or clearing its timer after success. Weather and city search have no request-generation guard; old results can overwrite newer units or city queries. Anime effects guard some state updates, but write watching-cache values before checking whether the request is still current. The initial watching effect does not restart on username changes, so it can display old-user results after a newer refresh.

Fix: use AbortController with bounded deadlines and cleanup, plus a generation or request-key check before every state/cache commit. Fetch independent schedule and watching data independently. Key caches by username, date/timezone, and weather units/location as appropriate. Add in-flight deduplication and treat storage as optional. Test deliberately reordered responses, username changes, unit changes, unmount, and stalled providers.

### F07 — P2: Background media URLs and drag listeners lack complete lifecycle cleanup

Evidence: [background upload](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/components/SettingsPanel/MediaSettings.jsx:77>), [startup loader](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/hooks/useBackgroundLoader.js:10>), [drag hook](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/hooks/usePointerReorder.js:58>), and [database helpers](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/services/db.js:44>).

Uploaded object URLs are never revoked when replaced or reset. The startup loader can resolve after effect cleanup, create a new URL, and update global state without a remaining owner to revoke it; React StrictMode makes this lifecycle relevant during development. Drag listeners are removed on pointer completion but not if their component unmounts mid-drag. Database write helpers handle `onerror` but not transaction abort explicitly, and deletion failures are swallowed, allowing a successful-looking reset to restore old media after reload.

Fix: give object URLs one lifecycle owner, revoke replaced URLs, ignore late loads, clean up active drags on unmount, and settle database operations on complete/error/abort. Surface failed deletion. Test delayed IndexedDB completion, repeated uploads, reset/reload, aborted writes, and resize during an active drag.

### F08 — P2: Search history keyboard navigation and replay are incorrect

Evidence: [keyboard handler](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/components/SearchBox.jsx:298>) and [history replay](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/components/SearchBox.jsx:403>).

An empty query shows recent history. ArrowDown copies the first history entry into `query`; subsequent rendering/keyboard handling switches to the suggestions branch because `query` is now nonempty. The history list disappears or navigation operates on a different list. History clicks also reconstruct a URL from `engineName` instead of replaying the stored URL: entering `github.com` directly records its URL under Google, then clicking that history item performs a Google search.

Fix: track dropdown mode and highlighted selection independently from typed text. Reuse one validated navigation function for mouse and keyboard, and replay the saved destination/engine consistently. Add multi-item arrow navigation and direct-URL replay tests. Debounce suggestions, use monotonic request IDs instead of millisecond timestamps, and prevent stale callbacks from repopulating cleared queries.

### F09 — P2: Third-party JavaScript and media integration need tighter trust boundaries

Evidence: [JSONP injection](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/components/SearchBox.jsx:143>), [popup navigation](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/components/SearchBox.jsx:193>), and [YouTube message listener](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/components/LofiPlayer.jsx:42>).

Search suggestions execute a third-party script in the dashboard's origin on input changes. That script has the page's privileges, including access to local settings, history, and local media storage. This is a trust dependency, not evidence that Google is currently compromised. Typed text is also sent before search submission, with no suggestion opt-out.

Lofi messages check YouTube's origin but not `event.source`. The dashboard can contain a YouTube trailer at the same time, so trailer playback events can incorrectly change the lofi player's displayed state. Outgoing commands use `'*'`. Search `window.open` calls lack explicit `noopener`; custom engine templates and imported URLs need protocol validation. Speed-dial anchors already use `noopener noreferrer`, which is good.

Fix: prefer a data-only suggestion mechanism, or make remote suggestions optional and clearly disclose their behavior; retain local history when disabled. Validate imported destinations and use explicit safe popup options. Bind YouTube messages to the intended iframe, validate message shape, and target the exact YouTube origin. Test trailer/lofi isolation and confirm actual playback rather than relying only on optimistic toggles. See [OWASP third-party JavaScript guidance](https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html) and [MDN postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage). Evaluate a compatible content security policy after removing avoidable dynamic scripts; inline scripts/styles in the single-file distribution need an intentional policy.

### F10 — P2: Weather can stay loading, show stale data without explanation, and mislabel conditions

Evidence: [condition mapping](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/components/WeatherWidget.jsx:84>), [response handling](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/components/WeatherWidget.jsx:258>), and [production-only omission of offline status](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/components/WeatherWidget.jsx:490>).

The forecast request does not reject a non-success HTTP status. If JSON lacks `current`, it returns without setting an error, leaving the initial loading skeleton until a later refresh. Cached weather has a timestamp but no unit/location identity. Offline indicators and stale timestamps are gated behind `import.meta.env.DEV`, so production users can mistake stale weather for current conditions. Snow-shower codes 85/86 fall through to the clear/sun mapping. The fallback-location flag is only set true and is not reset when GPS later succeeds.

Fix: validate status and response shape, model loading/fresh/stale/error states explicitly, store cache identity and freshness, share weather-code definitions with Greeting, and show stale status in production. Test 4xx/5xx JSON bodies, invalid cached shapes, offline reload after changing units, codes 85/86, and fallback-to-GPS recovery.

### F11 — P2: Build output and build workflow do not meet the documented contract

Evidence: [build script](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/package.json:9>), [MAL synchronizer](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/scripts/sync-mal-default.js:26>), [favicon input](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/index.html:5>), and [CI workflow](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/.github/workflows/deploy.yml:41>).

The favicon is emitted as a separate 489 kB PNG, despite the promise of one portable HTML file. The page itself also contains the large inlined background video; splitting JavaScript into chunks would conflict with the single-file goal. The default video is 2,084,874 bytes and the source logo is 489,148 bytes.

Every `npm run build` first contacts MAL and may modify tracked `defaultWatching.json`. CI builds once during validation and again during deployment, so the deployed artifact can contain different remote data from the artifact validated earlier. One global concurrency group also allows an unrelated PR run to cancel another validation or deployment run.

Fix: make data synchronization an explicit maintenance command with schema validation and a reviewed snapshot. Build without network or source changes, inline the favicon deliberately, optimize the oversized raster assets, and upload/deploy the exact artifact produced by the tested build. Scope concurrency by workflow/ref or isolate deploy concurrency. Scope Pages/id-token write permissions to deployment. Add artifact checks for external local asset references, expected output files, source-tree cleanliness, and bundle-size growth.

### F12 — P2: Build dependency has a current security advisory

The installed dependency chain ends in `braces@3.0.3`. npm reports three high-severity package entries, but these describe one underlying stack-exhaustion advisory, not three separate browser vulnerabilities. It is a development/build dependency. The current single-file configuration leaves `inlinePattern` empty, and the inspected plugin only invokes micromatch when that option is populated; hostile pattern reachability was not demonstrated here.

The [GitHub advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists versions through 3.0.3 as affected and no patched release at review time. npm proposes downgrading `vite-plugin-singlefile` to 0.9.0, a major backward change. Do not apply `npm audit fix --force` blindly. Investigate an actively compatible replacement, maintained fix, or small reviewed patch, and verify the single-file output on Vite 8. If remediation must wait, document the actual build-only exposure and review it on a bounded schedule.

### F13 — P2/P3: Compact layout and accessibility have inconsistent behavior

Evidence: [compact composition](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/components/CompactLayout.jsx:66>), [navigation tabs](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/components/TopNav.jsx:49>), and [settings dialogs](<C:/Users/claudio/Desktop/Life project/Portfolio apps/good_morning/src/components/SettingsPanel/index.jsx:467>).

Desktop widgets have individual error boundaries; compact widgets do not, so a malformed widget value can take down the compact interface. Compact layout starts anime fetching even when both anime widgets are disabled and preloads the sidebar whenever it is enabled, regardless of active tab. Resizing across 1024px unmounts/recreates the lofi player and interrupts playback.

Settings/reset popups lack dialog semantics, focus trapping/restoration, and Escape handling. Tabs lack linked tab/panel IDs and arrow-key selection. City suggestions are mouse-only list items. Drag reordering lacks a keyboard alternative. Existing focus-visible styles, quote keyboard handling, and reduced-motion CSS should be preserved. CSS reduced motion does not itself stop the autoplay background video.

Fix: apply consistent error isolation, gate data fetching by feature enablement, keep media playback above layout switching if continuity is desired, and finish keyboard/focus behavior. Add desktop/compact browser checks, automated accessibility checks, and an option to pause background motion. Treat preload/playback continuity as explicit UX choices rather than accidental side effects.

## File size and folder structure

Line counts include comments and whitespace. Splitting is justified by responsibilities, not by an arbitrary maximum size.

| Current file | Lines | Suggested boundary |
| --- | ---: | --- |
| `src/components/SettingsPanel/index.jsx` | 555 | Keep panel orchestration; extract ProfileSettings, WeatherSettings/city search, SpeedDialSettings, BackupRestoreSettings, ResetSettings, and shared dialog behavior. |
| `src/components/WeatherWidget.jsx` | 548 | Extract weather/location services, useWeather hook, WeatherIcons, shared details/forecast rendering, and condition mapping. Keep desktop and compact presentations thin. |
| `src/services/animeService.js` | 541 | Split schedule providers, MAL providers, parsers, date conversion, and cache helpers. Avoid maintaining a single mixed provider/parser/cache module. |
| `src/hooks/useAnimeSchedule.js` | 410 | Separate schedule data, watching-list synchronization, and trailer-preview behavior. Keep one composition hook shared by both layouts. |
| `src/components/SearchBox.jsx` | 440 | Extract engines/navigation, recent history, suggestion lifecycle, and dropdown selection. |
| `src/components/SettingsPanel/MediaSettings.jsx` | 372 | Split background upload/storage controls from station management and volume controls. Move old-name migration out of the mounted settings UI. |
| `src/components/LofiPlayer.jsx` | 361 | Extract a YouTube controller hook and shared station-list component, with separate compact/desktop views. |
| `src/components/AnimeSchedule/AnimeSchedule.css` | 879 | Split by card, sidebar, today list, and preview ownership; preserve intentional responsive overrides. |
| `src/components/SettingsPanel/SettingsPanel.css` | 515 | Split section/dialog styles as their owning components are extracted. |

Tests also contain large files: `animeService.test.js` has 563 lines and `AnimeCard.test.jsx` has 459. Split tests with the responsibilities they verify; do not delete them merely for size.

Keep the existing top-level layers. A practical target is:

```text
src/
  components/
    SettingsPanel/        # panel, focused sections, dialogs, colocated tests/styles
    WeatherWidget/        # views, icons, details, colocated tests/styles
    SearchBox/            # input/dropdown views and tests
    LofiPlayer/           # views, station list and tests
    AnimeSchedule/        # existing structure, smaller owned styles
  hooks/                  # shared React lifecycle/composition hooks
  services/
    anime/                # schedule, watching, providers, parsers, time, cache
    weather/              # forecast, location, response normalization
    settingsBackup.js
  stores/                 # settings store plus schema/migrations
  utils/                  # storage adapter and URL validation
  constants/              # shared themes, fonts, weather codes, engine presets
  test/                   # shared fixtures/setup; browser tests can live in e2e/
```

Use one test-location convention for newly touched modules, preferably colocated `.test.*` files. Existing mixed `__tests__` and sibling tests are mildly inconsistent but do not justify a standalone mass move. Deduplicate favicon/URL helpers, station rendering, weather details, and day constants where their behavior really is shared. Do not introduce generic component frameworks or remove all `memo` calls without profiling.

## Legacy files and deletion decisions

| Candidate | Recommended action |
| --- | --- |
| `.claude/specs.md` | Archive as a historical proposal or rewrite. It describes removed SettingsContext and monolithic files, and proposes a Firebase migration that is not the current architecture. It should not be treated as current requirements. |
| `.claude/tests_manifest.md` | Remove or replace with automatically generated information after extracting any useful notes. A manual file-presence checklist is not a measure of behavioral coverage. |
| `CLAUDE.md` | Update rather than delete if still used by the project owner. Its MAL provider/timeouts and schedule-provider descriptions are stale. |
| `src/assets/defaultWatching.json` and `scripts/sync-mal-default.js` | Referenced and active, so not dead files. First remove implicit build synchronization and owner-only behavior; then decide whether an explicit offline snapshot feature is useful. Delete only when all callers and expectations are removed. |
| Legacy `dash_*` keys and station-name migration | Consolidate into a versioned migration. Do not discard existing user preferences by deleting fallback readers first. Add a supported migration test and retire old paths deliberately. |
| `getJstDayRange` alias and production branch accepting test-only response shapes | Update callers and realistic provider fixtures, then remove misleading compatibility/test accommodations if no supported consumer requires them. |
| `dist/`, `node_modules/` | Already ignored and absent from tracked files. Normal generated/dependency directories, not source clutter. Do not delete them as a code-quality fix. |
| `public/` | Empty and untracked. Optional removal has no functional effect. |
| Local improvement notes and `.claude/settings.local.json` | Already ignored. Keep as local notes unless the owner no longer needs them. |
| Remaining runtime modules/assets | No unused application file was established as safe to delete during this audit. Avoid speculative deletions or automated removal of dynamically used CSS. |

README corrections are also needed: it says MIT, while LICENSE states proprietary/all rights reserved; it advertises hourly weather/precipitation details that the implementation does not request; it promises a single file that the build does not currently produce; its clone URL is a placeholder; and its broad Node 20 prerequisite does not reflect installed tool requirements. Resolve the intended license wording explicitly without changing the license automatically. Align naming across Aura, Good Morning, backup filenames, and personal defaults where useful.

## Implementation plan

Each stage should be independently reviewable. Keep moves separate from behavior changes where practical. Do not add Firebase, authentication, a new state manager, or a TypeScript migration as prerequisites for fixing these issues.

| Stage | Work | Required evidence before moving on |
| --- | --- | --- |
| 1. Protect saved data and startup | F01–F03: schema, allowlisted hydration/import, safe storage adapter, scoped reset, versioned backup/migration, preserve zero volume. | Malformed current/legacy backups do not crash or overwrite actions; denied/quota storage degrades gracefully; failed import leaves existing settings intact; unrelated origin data survives reset; export/import round-trip works. |
| 2. Repair external-data correctness | F04–F06 and F10: provider contracts, authoritative MAL results, timeout/abort/generation handling, proper dates/IDs/pagination, cache identities, weather status. | Empty RSS cannot beat authoritative data; deleted shows disappear; old responses cannot replace current-user/unit/city data; null/invalid caches recover; DST and cross-provider fixtures agree; all requests settle within their deadlines. |
| 3. Fix interaction and lifecycle bugs | F07–F09 and relevant F13: URL ownership, drag cleanup, search navigation/replay, YouTube source isolation, safe navigation, compact error boundaries, keyboard/focus behavior. | Repeated media replacement does not retain obsolete URLs; unmount/resize during drag is safe; history works by mouse/keyboard; trailer events do not alter lofi state; disabled widgets do not fetch unnecessarily; dialogs work from keyboard. |
| 4. Make release output reproducible | F11–F12: separate sync command, source-clean offline build, inline/optimize favicon and media, remediate/document build advisory, deploy validated artifact, fix concurrency/permissions. | `npm ci`, lint, tests, and build pass on the supported CI runtime; build does not fetch external data or modify tracked files; output obeys the chosen one-file contract; only the tested artifact is deployed; dependency risk is resolved or explicitly time-bounded. |
| 5. Extract cohesive modules | Perform the file splits above after the behavior is covered; consolidate shared fixtures and selected duplicate logic; normalize tests as modules are touched. | Existing and new behavioral tests pass; imports remain acyclic and public module boundaries are clear; visual behavior is preserved in desktop/compact layouts. No arbitrary line-count target. |
| 6. Retire stale material and document support | Archive/remove obsolete documents and migration branches where proven safe; correct README/license claims, provider descriptions, runtime prerequisite and privacy/offline expectations. | Every deletion has a caller/reference check; supported old settings still migrate; documentation matches actual commands, output, features, and license. |

Suggested first change: combine the settings schema, safe storage adapter, scoped reset, and focused regressions into the initial reliability work. These changes protect user data and establish reusable boundaries for later extractions.

## Verification improvements

The 447 passing tests provide a useful baseline, but many component tests replace the store and network with mocks. Add tests at the boundaries where the failures occurred rather than increasing test counts through setter or rendering checks alone.

- Use real-store integration tests for import, hydration, migration, export, reset, denied storage, and quota failures.
- Replace the unconditional 24-hour date assertion with fixed-date DST and timezone fixtures.
- Use representative AniList/Jikan/MAL/RSS response fixtures, delayed responses, pagination, empty authoritative results, malformed cached JSON values, and non-success HTTP bodies.
- Add lifecycle tests with pending requests/IndexedDB operations and simultaneous trailer/lofi iframes.
- Add a small browser smoke suite for desktop, compact portrait/landscape, keyboard focus, touch reordering, reload persistence, failed APIs, and the built artifact opened in supported modes. Keep live-provider availability checks separate from deterministic CI tests.
- Add a shared test setup and explicit mock cleanup, plus an artifact-contract check and a documented runtime version. Consider lightweight JSDoc/checkJs for settings and provider shapes after the core fixes; a full language migration is optional.

Acceptance for the cleanup: all existing checks pass, the newly identified failure cases are covered, user data is preserved, builds are repeatable, the output contract is verified, and stale files are removed only after their supported behavior has been migrated or retired.
