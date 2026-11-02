# Good Morning (Aura) — Next Improvements & Roadmap

Remaining work for the **Good Morning (Aura)** personal start-page dashboard, ordered by priority.

## Priority 1 — Distribution & Reach (Free Core Enhancements)

### 1. Browser "New Tab" Extension Packaging (Chrome, Edge & Firefox)

* **Implementation**: A separate Manifest V3 Vite build (`manifest.json` with `chrome_url_overrides.newtab`), local fonts/media, Chromium and Firefox ZIP packages, and an extension smoke-test suite. See [installation and release instructions](docs/extensions.md).
* **What it does**:
  * Opens **Good Morning (Aura)** locally without waiting for a dashboard download whenever users press `Ctrl+T` (New Tab). Live widgets still need network access.
  * Gives the dashboard organic discovery in browser extension stores and makes it a true daily-driver start page.
* **Release work remaining**: Deploy the extension-compatible MAL Worker, verify live integrations in each browser, prepare store listings/privacy links, and submit the generated packages for review/signing. Packaging does not publish the extension.

---

### 3. Interactive Desktop Companion / Mascot (Optional Widget)

* **What it is**: An optional, toggleable pixel-art companion living in the corner of the dashboard (disabled by default for minimalists).
* **What it does**:
  * Displays cozy idle animations that react to the time of day and app state (drinking coffee in the morning, grooving with headphones when Lofi is playing, focusing during a Pomodoro timer, sleeping late at night).
  * Shows occasional non-intrusive speech bubbles with greetings, quotes, or study encouragement.

---

## Priority 3 — Future Monetization / "Aura Supporter" Tier

### 4. Offline-First Cross-Device Cloud Sync

* **What it is**: An opt-in background cloud synchronization service (via Supabase or Firebase) built on top of the local-first Zustand + IndexedDB storage engine.
* **What it does**:
  * Keeps boot times instant (`0ms` network wait) by always reading from local storage first, then syncing changes in the background.
  * Automatically backs up and syncs speed dials, custom Lofi stations, MAL preferences, and theme settings across Desktop, Laptop, and Mobile devices.
  * **Monetization Fit**: Because cloud storage/sync has a real backend hosting motive, it serves as the flagship perk if an optional **"Aura Supporter / Cloud Tier"** (`$2–$3/mo` or one-time lifetime unlock) is introduced in the future—while keeping the local-only app 100% free forever.
