# Aura

A customizable React dashboard and browser start page with a clock, weather, search, bookmarks, anime schedules, and background music.

## Run locally

Use Node.js 22.12 or newer and npm. From this project directory:

```sh
npm ci
npm run dev
```

The development server is local-only by default. `npm run preview` serves the production output after a build.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server with live updates |
| `npm run lint` | Check JavaScript and React code |
| `npm test` | Run unit and integration tests |
| `npm run build` | Create and verify `dist/index.html` |
| `npm run preview` | Preview the production build |
| `npm audit` | Check current dependency advisories |

## Features

- Digital and analog clocks, 12/24-hour time, time-aware greetings and themes.
- Current weather and a three-day forecast, Celsius/Fahrenheit, GPS with IP and city fallbacks.
- Portugal-local anime schedules from AniList, including daylight-saving changes and labeled saved-schedule fallback during outages.
- MyAnimeList watching-list synchronization using the local Vite proxy in development (`/api/mal`) and the dedicated Cloudflare Worker in production. Complete paginated JSON lists are validated and cached per username; matching saved lists remain available with their last sync time during outages. Settings offers a cache-bypassing retry and clear status feedback for rate limits or temporary unavailability.
- Search prefixes, recent-search keyboard navigation, custom engine support through settings backups, and editable/reorderable bookmarks.
- YouTube background radio and trailers, shared volume, station controls, and playback-failure feedback. The radio iframe stays mounted while switching between desktop and compact layouts.
- Local image/video backgrounds, themes, optional Google Fonts, motion controls, and versioned settings backups.

## Storage, privacy, and offline behavior

Settings, bookmarks, and caches use browser storage; background files use IndexedDB. Storage is local to the browser and is not encrypted by this application. No account or backend is required. If storage is denied or full, ordinary dashboard settings can continue in memory; backup import reports persistence failures.

Online search suggestions are **off by default**. Enabling them sends typed text to Google through data-only requests. Browsers may block those requests, in which case local search and history still work. Bookmark favicons, fonts, weather, geolocation fallback, AniList schedules, the dedicated MAL Worker, and YouTube use external services. The MAL Worker and MyAnimeList receive only the requested public username; no account credentials or third-party CORS/RSS proxies are used.

Backups include validated settings and bookmarks, not background files, recent searches, or transient API caches. Old Aura `dash_*` backup files remain supported for known settings. Reset removes Aura-owned `dash_*` storage and its saved background; it does not clear other applications' caches or unregister their service workers.

The production distribution is one self-contained HTML file with local scripts, styles, logo, favicon, and default video embedded. It builds without network requests or source changes. Dynamic services still need internet access. Serving the file over HTTP/HTTPS provides more consistent browser storage and media support than opening a `file:` URL; YouTube playback also depends on browser and provider restrictions.

The default video and original high-resolution logo account for most of the bundle. The build enforces a 5 MB maximum and checks for leftover runtime asset references and matching script security hashes.

GitHub Pages uses the dedicated MAL Worker configured in `src/services/api.js`. The Worker is deployed separately; see [MAL Worker setup](workers/mal/README.md). It supports arbitrary public usernames, enforces rate limits and response bounds, coalesces concurrent cache misses, and caches each username/page separately for five minutes. Local development uses the Vite `/api/mal` proxy.

## Architecture and verification

`src/components` contains views and focused settings sections; `src/hooks` owns React lifecycles; `src/services` contains network, backup, and database operations; `src/stores` contains the settings schema and persistence. Anime services are split into schedule, watching, parser, and time modules.

The production packager is a small local Vite plugin in `scripts/single-file.js`. GitHub Actions runs lint, tests, and the artifact checks, then deploys that exact validated artifact on pushes to `main`. Deployment permissions are scoped to the deploy job.

See [the original audit](docs/PROJECT_AUDIT.md) and [the remediation and verification record](docs/REMEDIATION.md). The historical architecture proposal in `docs/archive` is not a current requirement.

## License

The project is proprietary. See [LICENSE](LICENSE) for the owner's terms. Earlier README references to an MIT license were incorrect.
