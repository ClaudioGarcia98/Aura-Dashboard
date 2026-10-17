# Good Morning (Aura) — Next Improvements & Roadmap

Remaining work for the **Good Morning (Aura)** personal start-page dashboard, ordered by priority.

## Priority 1 — Distribution & Reach (Free Core Enhancements)

### 1. Browser "New Tab" Extension Packaging (Chrome, Edge & Firefox)

* **What it is**: A lightweight Manifest V3 wrapper (`manifest.json` with `chrome_url_overrides.newtab`) generated from the Vite build.
* **What it does**:
  * Allows users to install **Good Morning (Aura)** from the Chrome Web Store, Edge Add-ons, or Firefox Add-ons so it opens automatically with zero latency every time they press `Ctrl+T` (New Tab).
  * Gives the dashboard organic discovery in browser extension stores and makes it a true daily-driver start page.

---

### 2. Multi-Language Support (i18n)

* **What it is**: A lightweight dictionary-based localization system (`en`, `pt`, `es`, `ja`) with a language selector pill in **Settings → Appearance**.
* **What it does**:
  * Translates time-of-day greetings (*Good Morning / Bom Dia / Ohayou*), clock date strings, weather condition descriptions, anime airing day labels, and all Settings panel tabs and tooltips.
  * Expands accessibility for international anime and productivity communities with near-zero bundle overhead.

---

## Priority 2 — Cozy Experience Polish (Optional Widgets)

### 3. Ambient Sound Mixer

* **What it is**: A multi-track ambient audio layer (Rain, Thunder, Fireplace, Keyboard Typing, Coffee Shop, Night Crickets) with independent volume sliders.
* **What it does**:
  * Runs alongside the YouTube Lofi stream so users can mix background rain or fireplace crackle over their music at custom volumes.
  * Can also be used standalone when offline or when a user prefers pure nature sounds over music.

---

### 4. Interactive Desktop Companion / Mascot (Optional Widget)

* **What it is**: An optional, toggleable pixel-art companion living in the corner of the dashboard (disabled by default for minimalists).
* **What it does**:
  * Displays cozy idle animations that react to the time of day and app state (drinking coffee in the morning, grooving with headphones when Lofi is playing, focusing during a Pomodoro timer, sleeping late at night).
  * Shows occasional non-intrusive speech bubbles with greetings, quotes, or study encouragement.

---

## Priority 3 — Future Monetization / "Aura Supporter" Tier

### 5. Offline-First Cross-Device Cloud Sync

* **What it is**: An opt-in background cloud synchronization service (via Supabase or Firebase) built on top of the local-first Zustand + IndexedDB storage engine.
* **What it does**:
  * Keeps boot times instant (`0ms` network wait) by always reading from local storage first, then syncing changes in the background.
  * Automatically backs up and syncs speed dials, custom Lofi stations, MAL preferences, and theme settings across Desktop, Laptop, and Mobile devices.
  * **Monetization Fit**: Because cloud storage/sync has a real backend hosting motive, it serves as the flagship perk if an optional **"Aura Supporter / Cloud Tier"** (`$2–$3/mo` or one-time lifetime unlock) is introduced in the future—while keeping the local-only app 100% free forever.
