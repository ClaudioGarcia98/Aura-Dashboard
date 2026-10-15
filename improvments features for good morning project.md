# Good Morning (Aura) — Project Roadmap & Feature Improvements

A curated and actionable backlog of proposed improvements, architecture upgrades, and new feature concepts for the **Good Morning / Aura** personal dashboard.

---

## 🚀 High-Priority Features

### 1. Progressive Web App (PWA) & Offline Shell
* **Goal**: Enable users to install the dashboard on mobile ("Add to Home Screen") and desktop (Chrome / Edge "Install App") as a standalone window without browser chrome.
* **Implementation Details**:
  * Integrate `vite-plugin-pwa` to generate a standard Web App Manifest (`manifest.json`) and Service Worker.
  * Define standalone display mode, orientation preferences, app icons (`192x192`, `512x512`), and theme colors.
  * Cache static assets (CSS, JS bundles, fonts, default logos) via Workbox for instant sub-second boot times, even when offline.
  * Gracefully display cached weather, quotes, and speed dials if network connectivity is unavailable.

---

### 2. Offline-First Cross-Device Cloud Sync
* **Goal**: Seamlessly synchronize settings, custom speed dials, custom lofi stations, and preferences across devices (e.g. desktop PC, laptop, phone) without requiring forced logins.
* **Architecture Design**:
  * **Local-First (Zero Latency)**: Zustand continues to read and write directly to `localStorage` and `IndexedDB`. The dashboard never waits on a network round-trip to render the UI on boot.
  * **Asynchronous Background Sync**: Connect to a free-tier cloud backend (Supabase or Firebase Firestore) via an anonymous or opt-in account token / sync code.
  * **Resilient Quota Fallback**: If offline or reaching free tier limits, syncing gracefully pauses without errors or UI disruption. Local data remains 100% functional.
  * **Lightweight Payloads**: By storing video backgrounds locally in IndexedDB and only syncing small JSON settings (themes, dials, station URLs), per-user cloud payloads remain tiny (~1KB).

---

### 3. Multi-Language Support (i18n)
* **Goal**: Provide localized greetings, UI controls, weather status descriptions, and tooltips in multiple languages.
* **Implementation Details**:
  * Implement a lightweight translation dictionary structure (e.g., English, Portuguese, Spanish, Japanese).
  * Translate dynamic greetings (Morning, Afternoon, Evening, Night), date formatting strings, Settings panel tabs and labels, and anime schedule day names.
  * Add a language picker pill in **Settings → Appearance**.

---

## 🎨 Content & Experience Enhancements

### 4. Swappable Entertainment Tracker (Anime ↔ Movies & TV Series)
* **Goal**: Allow users who don't watch anime to use the daily schedule and premiere tracker for Western TV shows and cinema releases.
* **Implementation Details**:
  * **Modular Source Toggle**: Add a toggle in **Settings → Widgets** to switch the schedule source between **Anime** (via Jikan / MyAnimeList) and **Movies & TV** (via TMDB or TVMaze).
  * **TVMaze / TMDB Integration**:
    * TVMaze API (100% free, no key required): Daily airing TV schedule by country.
    * The Movie Database (TMDB API): In-theater and upcoming digital streaming releases, trending daily movies, and user watchlists.
  * Re-use the existing card layout and trailer preview modal with TMDB video trailers.

---

### 5. Interactive Desktop Companion / Mascot (Optional Widget)
* **Goal**: A playful, optional pixel-art character or Tamagotchi-style companion living in the bottom corner of the dashboard.
* **Implementation Details**:
  * Toggleable under **Settings → Widgets** (disabled by default so minimalists have an uncluttered interface).
  * Pixel-art character with ambient idle animations (reading a book, drinking tea, sleeping at night).
  * Context-aware speech bubbles (e.g., motivational quotes, greeting on first daily open, study timer encouragement).

---

## 📖 Repository & Open Source Polish

### 6. Polished Showcase README & Sponsorship
* **README Upgrade**:
  * Hero banner and high-resolution GIF demonstration of the dashboard in action (showing desktop layout and mobile tabs).
  * Feature matrix highlighting unique capabilities: MAL watchlist matching, live YouTube lofi player with volume sync, speed dials with custom drag & drop, and glassmorphism themes.
  * Step-by-step local setup guide (`npm install`, `npm run dev`) and customization instructions.
* **Support & Sponsorship**:
  * Add a friendly "Buy Me a Coffee" or GitHub Sponsors badge in the README.
  * Include an unobtrusive donation / credit link in the Settings panel footer.

---

## ✅ Completed Milestones Archive

* [x] **MyAnimeList Connection Proxy**: Local Vite proxy with 25s timeout ceiling and fallback mirrors for high origin reliability.
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