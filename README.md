<div align="center">

# ✨ Good Morning — Aura Dashboard

**A cozy, local-first personal start page & productivity dashboard built with React, Vite, and glassmorphism.**  
Live anime airing schedules, MyAnimeList watchlist sync, ambient Lofi radio, weather forecasts, speed dials, and dynamic video wallpapers—compiled into a single self-contained HTML artifact.

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-FF7B54?style=for-the-badge&logo=github)](https://claudiogarcia98.github.io/Aura-Dashboard/)
[![Release](https://img.shields.io/badge/Release-v1.2.0-38BDF8?style=for-the-badge)](https://github.com/ClaudioGarcia98/Aura-Dashboard/releases/tag/v1.2.0)
[![Tests](https://img.shields.io/badge/Tests-656_Passing-22C55E?style=for-the-badge&logo=vitest)](https://github.com/ClaudioGarcia98/Aura-Dashboard/actions)
[![Node](https://img.shields.io/badge/Node-%3E%3D22.12-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Buy Me A Coffee](https://img.shields.io/badge/Support-Buy_Me_a_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/claudio091s)

</div>

---

## 🖥️ Visual Showcase

### Desktop Start Page (Aurora / Sunset Theme)
![Aura Desktop Dashboard](.github/assets/desktop-hero.jpg)

### Live Anime Schedule & Dynamic Glassmorphism Themes
| 📺 Weekly Anime Schedule (`AniList` + `MAL Sync`) | 🎨 Nine Themes & Shareable Appearance Presets |
| :---: | :---: |
| ![Anime Schedule Sidebar](.github/assets/desktop-schedule.jpg) | ![Dynamic Themes & Settings](.github/assets/desktop-themes.jpg) |

### Mobile-First Compact Tabbed Shell
| 📱 Mobile Home Tab | 📅 Mobile Anime Schedule Tab |
| :---: | :---: |
| <img src=".github/assets/mobile-home.jpg" alt="Mobile Home Tab" width="360" /> | <img src=".github/assets/mobile-schedule.jpg" alt="Mobile Anime Schedule Tab" width="360" /> |

---

## 🌟 Feature Matrix

| Feature | What It Does | Storage & Providers |
| :--- | :--- | :--- |
| **🕰️ Smart Clock & Greeting** | Digital, analog, or dual clock (`12h` / `24h`) paired with time-of-day and weather-aware greetings (*Morning*, *Afternoon*, *Evening*, *Night*) and anime quotes. | Local system clock + `Zustand` (`dash_settings`) |
| **📺 Live Anime Airing Tracker** | Displays **Today's Launch (Top 5)** and a full **7-day airing calendar** in the device's time zone or a saved manual override, with optional Japan (`JST`) reference times and live countdown badges. | **AniList GraphQL API** + cached stale-safe fallback |
| **🔗 MyAnimeList Watchlist Sync** | Connects any public MyAnimeList username—no login or API key required—and highlights every airing show on your `Watching` list with a glowing **`★ MY LIST`** badge. | Local Vite proxy (`/api/mal`) in dev · Dedicated **Cloudflare Worker v4** in prod |
| **🎬 Device-Adaptive Trailers** | Hovering an anime card on desktop opens a floating YouTube trailer portal; expanding a card on touch/mobile embeds a responsive `16:9` trailer with automatic teardown on collapse. | YouTube IFrame API (origin-verified) |
| **🎧 Persistent Lofi Radio** | Built-in YouTube Lofi stream player with curated stations, custom station URL support, shared global volume/mute memory, and uninterrupted playback when switching between desktop and mobile layouts. | YouTube IFrame API + `localStorage` |
| **⛅ Weather & 3-Day Forecast** | Current conditions (`°C` / `°F`), expandable 3-day forecast, and automatic location resolution with GPS, IP geolocation, and custom fallback city support. | **Open-Meteo API** + location/units-keyed cache |
| **🔍 Prefix Search & Speed Dials** | Multi-engine search bar with quick prefixes (`g `, `yt `, `mal `, `gh `, `r `), keyboard history navigation, opt-in data-only search suggestions, and reorderable bookmark Speed Dials. | Local history + `dash_settings` |
| **🎨 Dynamic Glassmorphism & Video Wallpapers** | 9 themes in one preview gallery, 6 typography presets (*Default*, *Raleway*, *Outfit*, *Nunito*, *JetBrains*, *Playfair*), and custom image/video wallpaper uploads stored offline. | **IndexedDB** (`dashDB`) for media + CSS custom properties |
| **🌐 Eight Language Options** | English, Portuguese (Portugal and Brazil), Spanish, French, German, Japanese, and Korean; browser detection, saved override, translated controls and accessibility labels, and locale-aware dates and numbers. | Bundled dictionaries + `dash_settings` |
| **🌍 Automatic or Manual Time Zone** | Clock, date, greeting and anime calendar follow the device's time zone or a saved city override, including daylight saving changes. Language remains independent; Japan time is an optional anime reference. | Browser `Intl` APIs; no GPS or external location service |
| **🍅 Today's Focus** | A 25-minute focus timer, 5-minute breaks and up to three daily priorities, with saved timer deadlines, optional completion chime and daily reset in the selected time zone. | Local `dash_focus_v1` storage |
| **🎨 Shareable Presets** | Export and preview theme, font, Lofi stations and optional wallpaper together. Importing preserves personal profiles, language, time zone, tasks and layout. | Validated portable JSON files |
| **💾 Versioned Backups & Clean Reset** | One-click JSON export/import of validated settings and bookmarks, plus an Aura-scoped reset that cleanly restores first-time visitor defaults without touching unrelated browser storage. | Guarded `safeStorage` adapter |

---

## ⚡ Quick-Start Guide

### Prerequisites
- **Node.js `22.12+`** and `npm`

### 1. Clone & Install
```sh
git clone https://github.com/ClaudioGarcia98/Aura-Dashboard.git
cd Aura-Dashboard
npm ci
```

### 2. Start the Local Development Server
```sh
npm run dev
```
Open the local URL shown in your terminal (default `http://localhost:5173`). In development, Vite automatically proxies `/api/mal` requests directly to MyAnimeList.

### 3. Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the local Vite development server with HMR and `/api/mal` proxy |
| `npm run lint` | Run ESLint across all JavaScript and React files |
| `npm test` | Run the full Vitest unit & integration suite, including localization coverage |
| `npm run build` | Package the app into a single self-contained `dist/index.html` and verify CSP hashes |
| `npm run preview` | Serve the production `dist/index.html` bundle locally |
| `npm audit` | Check dependency security advisories |

---

## 🛠️ Personalizing Your Dashboard

1. **Set Your Display Name & MAL Profile**: Click the **⚙️ Settings** gear (bottom-left on desktop, top bar on mobile) and enter your display name and public **MyAnimeList username** to highlight your airing shows.

2. **Customize Themes & Wallpapers**: Under **Theme**, choose a palette from the unified theme gallery. Under **Background**, upload an image or `.mp4` wallpaper (stored locally in IndexedDB).
3. **Use Search Shortcuts**: Press `Ctrl + Space` anywhere on desktop to focus the search bar, or type a prefix (`/yt lofi hip hop`, `/mal frieren`, `/gh react`) to jump straight to your target search engine.
4. **Backup Your Setup**: Scroll to **Backup & Restore** in Settings to export a portable `.json` snapshot of your speed dials, custom stations, and preferences.

**Settings order**: Language → Profile → Anime Schedule (MyAnimeList username and refresh) → Dashboard Layout → Theme, Font, Background and Share your setup → Clock Style, Clock Format and Time zone → Weather → Speed Dials → Media Volume and Lofi Stations → Privacy & Motion → shortcuts/search reference → Backup & Restore → Danger Zone. The MyAnimeList connection stays near the top on desktop, tablet and phone layouts. Automatic language and time-zone options have their own labels; each manual choice appears once, with equivalent time-zone aliases deduplicated.

**Today's Focus**: Start a 25-minute focus session or a 5-minute break from the card below the clock. Pause, resume, or reset at any time, and keep up to three daily priorities with checkboxes. Sessions dim distracting widgets while keeping the clock, tasks, and Lofi controls available. A soft completion chime follows your volume setting and can be switched off with the bell. Tasks and the running timer are saved locally; tasks clear at midnight in the selected time zone. Use **Settings → Dashboard Layout → Focus Timer & Tasks** to hide the card (this also pauses the timer). Keep Aura open for a completion chime; a saved timer catches up when you reopen it.

**Themes & presets**: Settings → Theme brings all palettes together in one gallery with matching previews, including **Catppuccin Mocha, Tokyo Night, Rosé Pine, and Matcha Forest** with dark tinted surfaces for readable text over animated wallpapers. Under **Share your setup**, export a `.aura-preset.json` file with your theme, font, and Lofi stations. Keep **Include wallpaper** checked to bundle an uploaded image/video (up to 50 MB), or switch it off for a small file that keeps the recipient's existing wallpaper. Import a preset to review its contents, then choose **Apply preset**. Presets preserve your profile, daily tasks, volume, and dashboard layout; full settings backups remain separate.

**Language**: The selector at the top of Settings offers **English, Português (Portugal), Português (Brasil), Español, Français, Deutsch, 日本語, and 한국어**. **Automatic** follows the first supported browser language, with English fallback. Changes apply immediately and are included in full settings backups; shared appearance presets preserve the recipient's language. Dates, clock day periods, weather values, weekday filters, countdown units, station-count plurals, errors, tooltips, and screen-reader labels follow the chosen locale. The bundled quote collection has translations for every language; non-English modes use that collection rather than the English-only remote quote service. Names, tasks, URLs, and station titles are preserved. Anime genres are translated, and Japanese titles use provider-supplied native titles when available. Language controls wording and date formatting; the separate time-zone setting controls the actual clock time and calendar day.

**Time zone**: Settings defaults to **Automatic**, following the device/browser time zone without GPS, IP lookup, permissions, API keys or paid services. A manual city/time-zone override applies immediately to the digital and analog clocks, date, greeting, time-based theme, daily focus tasks and anime schedule. Schedule requests and caches use the selected zone's calendar-day boundaries, including daylight saving and fractional UTC offsets. Japan time is an optional anime reference; when its date differs, its weekday is shown. Changing zones preserves existing focus priorities and running timer deadlines; the next midnight in the selected zone resets daily tasks. Time-zone and Japan-reference preferences persist and are included in full backups, while shared appearance presets preserve the recipient's preferences.

**Anime descriptions**: Synopses remain in their original English as supplied by AniList. Non-English interfaces show a localized “Synopsis available in English” note. No translation account, API key, additional Worker configuration, or external translation service is needed.

Translation sources live in `src/i18n/messages.js` and `src/i18n/quotes.js`. Add complete translations with matching named placeholders; render them through `useTranslation()` rather than concatenating translated fragments. Unknown messages fall back to their English source. Localization tests check catalog completeness, interpolation, switching, storage, formatting, browser preference changes, and preserving user content.

---

## 🔒 Privacy, Security & Architecture

- **100% Local-First**: Settings, speed dials, and API caches live in your browser's `localStorage`; custom video/image backgrounds live in `IndexedDB`. No user account or cloud database is required.
- **Privacy by Default**: Online search suggestions are **off by default** and use inert JSON requests only when explicitly enabled. MyAnimeList sync sends only the public username you type—never credentials or cookies.
- **Single-File Production Artifact**: `scripts/single-file.js` compiles all JS, CSS, fonts metadata, and default media into a single `dist/index.html` (< 5 MB) with strict `sha256` Content-Security-Policy (`CSP`) script hashes verified by `scripts/check-build.js`.
- **Dedicated MAL Worker Relay**: Production builds on GitHub Pages connect to a hardened Cloudflare Worker ([`workers/mal/`](workers/mal/README.md)) featuring per-IP rate limiting, request coalescing, upstream timeouts, and per-user edge caching.

---

## ☕ Support the Project

**Good Morning (Aura)** is free to use. If it brightens your daily workflow or anime tracking, consider supporting its continued development:

- ☕ [**Buy Me a Coffee (`buymeacoffee.com/claudio091s`)**](https://buymeacoffee.com/claudio091s)

---

## 📄 License

Copyright © 2026 Cláudio Garcia. All Rights Reserved.  
This project and its source code are proprietary. See [LICENSE](LICENSE) for full terms, and [SECURITY.md](.github/SECURITY.md) for repository security policies.
