# Mobile-First Responsive Redesign

A truly different layout on phones + tablets (≤1024px) — like Crunchyroll/Netflix web — driven by a **top navigation bar** and **full-screen tabs**, while desktop (>1024px) is completely unchanged.

## Core ideas

1. **Runtime split, not just CSS.** `App.jsx` checks `useMediaQuery('(max-width: 1024px)')`. If compact → render `<CompactLayout>`; otherwise render the existing desktop tree verbatim. Zero desktop regression.
2. **Top nav, not bottom nav.** Mobile browsers own the bottom of the screen; a page-level bottom bar fights browser chrome. The top bar is the web-native pattern.
3. **The page never scrolls (Option B).** The background is fixed and always full-screen. `body.compact-mode` is `overflow:hidden; height:100dvh`. Each tab is exactly one screen; only the **content inside the active tab** scrolls. There is never a black void below the background.

## Layout

```
┌─────────────────────┐
│  ░░ BACKGROUND ░░░  │  ← fixed, full viewport
│─────────────────────│
│ Aura   🏠 🎌 🎵 ⚙️ │  ← top nav (sticky, ≤1024px only)
│─────────────────────│
│                     │  ↑
│  active tab content │  │ only this scrolls
│         ↕           │  ↓
└─────────────────────┘
  [browser chrome]
```

## Tabs (built dynamically; a disabled widget hides its tab)

| Tab | Shown when | Content |
|-----|-----------|---------|
| 🏠 Home | always | Greeting, Clock, Quote, Search, **inline Weather card**, Speed Dial, "Today's Launch" top-5 |
| 🎌 Anime | `showAnimeSidebar` | Day-filter pills + full vertical schedule (static, no slide-over) |
| 🎵 Lofi | `showLofiPlayer && stations` | Expanded player: large visualizer, big play button, station list always visible |
| ⚙️ Settings | always | The full settings panel, embedded always-open |

- **Music never stops on tab switch:** `LofiPlayer` is mounted once at the compact-root (not inside a toggled panel); the hidden YouTube iframe is reused across the collapsed↔expanded transition. The Lofi tab icon shows a "playing" pulse.
- **Single anime data source:** `CompactLayout` owns one `useAnimeSchedule({ alwaysOpen })` instance feeding both the Home top-5 and the Anime tab — no double fetching.

## Desktop & tablet

- **Desktop (>1024px):** untouched — same floating widgets, slide-over sidebar, bottom-center lofi pill.
- **Tablet (769–1024px):** gets the new compact tab layout (per request).

## Files

**New**
- `src/hooks/useMediaQuery.js`
- `src/components/TopNav.jsx` + `TopNav.css`
- `src/components/CompactLayout.jsx` + `CompactLayout.css`
- `src/components/AnimeSchedule/TodayLaunch.jsx` (extracted top-5, shared desktop + compact)
- `src/components/AnimeSchedule/EmbeddedAnimeList.jsx` (static full schedule for the Anime tab)

**Modified**
- `src/App.jsx` — compact/desktop branch; `body.compact-mode` toggle; background `<video>`/`.overlay` → `position: fixed`.
- `src/index.css` — `--top-nav-height`; `.overlay` fixed; `body.compact-mode` page lock.
- `src/components/WeatherWidget.jsx` / `.css` — `inline` card variant.
- `src/components/LofiPlayer.jsx` / `.css` — `compact` + `expanded` full-screen player; `onPlayingChange`.
- `src/components/SettingsPanel/index.jsx` / `.css` — `embedded` always-open variant (no toggle/scrim/slide).
- `src/components/AnimeSchedule/index.jsx` — uses shared `TodayLaunch`.
- `src/hooks/useAnimeSchedule.js` — `{ alwaysOpen }` option so the embedded list loads without a slide-over open state.

## Manual verification

1. DevTools device mode @ 390px (phone) and 820px (tablet): top nav shows; the page does **not** scroll; only the active tab scrolls; background stays fixed/full-screen.
2. Each tab works; disabling Lofi/Anime in Settings removes their tabs.
3. Play music → switch tabs → audio keeps playing; Lofi tab icon pulses.
4. Desktop @ 1440px: identical to before, no top nav.
5. Video background on a tablet width: degrades gracefully (Android shows fixed video; iOS falls back to the dark base — no void).
