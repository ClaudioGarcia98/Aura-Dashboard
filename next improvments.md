# Good Morning (Aura) — Next Improvements & Roadmap

A curated, priority-ordered roadmap of feature improvements, distribution upgrades, and future monetization paths for the **Good Morning (Aura)** personal start-page dashboard.

---

## Priority 1 — Immediate High-Impact (Free & Community Growth)

### 1. Focus / Pomodoro Timer & "Today's Focus" Tasks
* **What it is**: A built-in, minimalist productivity timer (`25m Focus / 5m Break`) and a lightweight 1–3 item daily task checklist.
* **What it does**:
  * Pairs naturally with the existing Lofi YouTube player and ambient clock so users can study or work directly inside the dashboard.
  * Automatically dims non-essential widgets during an active Focus session to reduce distractions.
  * Plays a soft completion chime when a session ends and persists daily focus tasks locally in `localStorage`.

---

## Priority 2 — Distribution & Reach (Free Core Enhancements)

### 2. Browser "New Tab" Extension Packaging (Chrome, Edge & Firefox)
* **What it is**: A lightweight Manifest V3 wrapper (`manifest.json` with `chrome_url_overrides.newtab`) generated from the Vite build.
* **What it does**:
  * Allows users to install **Good Morning (Aura)** from the Chrome Web Store, Edge Add-ons, or Firefox Add-ons so it opens automatically with zero latency every time they press `Ctrl+T` (New Tab).
  * Gives the dashboard organic discovery in browser extension stores and makes it a true daily-driver start page.

---

### 3. Multi-Language Support (i18n)
* **What it is**: A lightweight dictionary-based localization system (`en`, `pt`, `es`, `ja`) with a language selector pill in **Settings → Appearance**.
* **What it does**:
  * Translates time-of-day greetings (*Good Morning / Bom Dia / Ohayou*), clock date strings, weather condition descriptions, anime airing day labels, and all Settings panel tabs and tooltips.
  * Expands accessibility for international anime and productivity communities with near-zero bundle overhead.

---

### 4. Expanded Curated Dark Glass Themes & Shareable Presets
* **What it is**: Additional dark-first color palettes (such as *Catppuccin Mocha*, *Tokyo Night*, *Rosé Pine*, and *Matcha Forest*) plus one-click preset sharing.
* **What it does**:
  * Preserves the signature dark frosted-glass aesthetic across live video wallpapers without washing out contrast.
  * Lets users export/import compact theme + wallpaper + Lofi station presets to share setups with friends or the community.

---

## Priority 3 — Cozy Experience Polish (Optional Widgets)

### 5. Ambient Sound Mixer
* **What it is**: A multi-track ambient audio layer (Rain, Thunder, Fireplace, Keyboard Typing, Coffee Shop, Night Crickets) with independent volume sliders.
* **What it does**:
  * Runs alongside the YouTube Lofi stream so users can mix background rain or fireplace crackle over their music at custom volumes.
  * Can also be used standalone when offline or when a user prefers pure nature sounds over music.

---

### 6. Interactive Desktop Companion / Mascot (Optional Widget)
* **What it is**: An optional, toggleable pixel-art companion living in the corner of the dashboard (disabled by default for minimalists).
* **What it does**:
  * Displays cozy idle animations that react to the time of day and app state (drinking coffee in the morning, grooving with headphones when Lofi is playing, focusing during a Pomodoro timer, sleeping late at night).
  * Shows occasional non-intrusive speech bubbles with greetings, quotes, or study encouragement.

---

## Priority 4 — Future Monetization / "Aura Supporter" Tier

### 7. Offline-First Cross-Device Cloud Sync
* **What it is**: An opt-in background cloud synchronization service (via Supabase or Firebase) built on top of the local-first Zustand + IndexedDB storage engine.
* **What it does**:
  * Keeps boot times instant (`0ms` network wait) by always reading from local storage first, then syncing changes in the background.
  * Automatically backs up and syncs speed dials, custom Lofi stations, MAL preferences, and theme settings across Desktop, Laptop, and Mobile devices.
  * **Monetization Fit**: Because cloud storage/sync has a real backend hosting motive, it serves as the flagship perk if an optional **"Aura Supporter / Cloud Tier"** (`$2–$3/mo` or one-time lifetime unlock) is introduced in the future—while keeping the local-only app 100% free forever.

---

## ✅ Completed Milestones Archive

* [x] **Polished Showcase README & Sponsorship**: High-resolution desktop and mobile visual showcase (`.github/assets/`), feature matrix, quick-start guide, GitHub `.github/FUNDING.yml` integration, and in-app **Buy Me a Coffee** (`buymeacoffee.com/claudio091s`) support link in the Settings footer.
* [x] **Repository Security & Rulesets**: Active GitHub branch/tag protection rulesets on `main` and `v*` tags, `CODEOWNERS`, `SECURITY.md`, Dependabot alerts, and Secret Scanning push protection.

* [x] **Streamlined Anime Providers**: Direct local Vite proxy in development and dedicated Cloudflare Worker v4 (`workers/mal`) in production for MyAnimeList, plus AniList GraphQL for live airing schedules—with discontinued Jikan and third-party CORS proxies removed.
* [x] **Multi-User Cache & Clean Public Reset**: Username-validated MAL cache with automatic cross-user invalidation, stale schedule warnings, and a clean default state (`username: ''`) on first visit or full data reset.
* [x] **Dynamic Theme & Glassmorphism Polish**: Theme-reactive borders, badges, focus rings, and ambient radial glows powered by CSS `color-mix()` across Midnight, Ocean, Cyberpunk, and Sunset themes.
* [x] **Verified MAL Profile Persistence**: Real-time connected indicator badge and watching list caching.
* [x] **Global Volume & Mute Toggle**: Dedicated one-click mute/unmute icon with memory volume restoration.
* [x] **Search Box & Speed Dial Clearance**: Fixed delete badge clipping with increased spacing and responsive vertical flow.
* [x] **Device-Adaptive Anime Trailers**:
  * Floating hover preview portal (`TrailerPreview`) on desktop with mouse.
  * 16:9 responsive in-card trailer on mobile/touchscreen devices upon expanding.
  * Automatic sound/network teardown on card collapse.
* [x] **Mobile-First Compact Shell**: Tabbed navigation shell (`TopNav`), fixed non-scrolling background, and dedicated fullscreen tabs.
* [x] **Landscape Mobile Optimization**: Dynamic scaling for viewports with $\le 520\text{px}$ height (compact TopNav, scaled clock, proportional search box, and tightened layout gaps).
* [x] **Mobile Settings Streamlining**: Automatically hide keyboard-only shortcut keys (`Ctrl+Space`, `Esc`) on touch devices while preserving search engine prefixes.
