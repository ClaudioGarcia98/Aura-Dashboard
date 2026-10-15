# Aura ✨

> An aesthetic, customizable, all-in-one personal dashboard and browser new-tab startpage. Zero backend required.

---

## 🌟 Overview

**Aura** transforms your browser's new tab into a functional dashboard. Built with React and Vite, Aura compiles into a **single, self-contained `index.html` file** with all scripts and styles inlined. It requires no backend, works offline for local assets, and stores your data securely inside your browser's `localStorage` and `IndexedDB`.

---

## 🚀 Key Features

* 🕒 **Contextual Clock & Greetings**:
  * Choose between a sleek Digital clock or an animated Canvas-based Analog face (with 12h/24h support).
  * Contextual greetings that adapt to your local time of day and live WMO weather condition codes (e.g. rain, fog, thunderstorms).
* 🌦️ **Smart Weather Forecast**:
  * Powered by Open-Meteo (free, no API key required).
  * Cascading geolocation pipeline: GPS Geolocation $\rightarrow$ IP Geolocation fallback (`ipapi.co`) $\rightarrow$ manual fallback city.
  * Interactive detail panel with hourly temperatures, humidity, wind speed, and precipitation forecasts.
* 🎌 **Anime Tracker ("Today's Launch")**:
  * Live daily airing schedule powered by the Jikan API (v4).
  * Hover to preview official anime trailers in an embedded YouTube modal.
  * Synchronize with your personal **MyAnimeList (MAL)** currently-watching list via proxy fallbacks.
* 🎵 **Lofi Radio Player**:
  * Continuous ambient music player powered by the YouTube IFrame API.
  * Real-time audio visualizer bar with smooth volume and station controls.
  * Preset stations (Lofi Girl, Synthwave, Chillhop, Jazzhop, Rain, Anime) and custom station management.
* 🔍 **Multi-Engine Search & Speed Dials**:
  * Instant search engine switcher (Google, DuckDuckGo, Bing, YouTube, GitHub, Reddit) with custom engine support.
  * Live search suggestions dropdown powered by Google JSONP.
  * Customizable Speed Dial bookmarks with automatic favicon detection and pointer drag-and-drop reordering.
* 🎨 **Theming & Ambient Media**:
  * Dynamic **Aurora** circadian theme that shifts accent colors and glow throughout the day.
  * Presets including Nord, Tokyo Night, Cyberpunk, Forest, and custom Google Web Fonts.
  * Upload custom video (MP4), animated GIF, or image backgrounds stored locally in **IndexedDB** (`dashDB`).
* 🌙 **Idle Dimming Mode**:
  * Dims dashboard opacity to 20% after 2 minutes of inactivity for a minimalist screensaver aesthetic.

---

## 🛠️ Tech Stack

* **Frontend**: [React 19](https://react.dev/), [Vite 8](https://vitejs.dev/)
* **State Management**: [Zustand 5](https://zustand-demo.pmnd.rs/) with `persist` middleware
* **Packaging**: [`vite-plugin-singlefile`](https://github.com/richardtallent/vite-plugin-singlefile) (inlines all assets into one HTML file)
* **Testing**: [Vitest 4](https://vitest.dev/), React Testing Library
* **Linting & Code Quality**: ESLint 10

---

## 📦 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (version 20 or higher recommended)
* `npm`

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/aura.git
cd aura

# Install dependencies
npm install
```

### Development & Build Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Launch local development server with HMR at `http://localhost:5173` |
| `npm run build` | Compile the self-contained production bundle into `dist/index.html` |
| `npm run preview` | Preview the production build locally at `http://localhost:4173` |
| `npm test` | Run the full Vitest unit test suite (300+ tests) |
| `npm run lint` | Run ESLint across `src/` |

---

## 🚢 Deployment

Aura includes a pre-configured [GitHub Actions workflow](.github/workflows/deploy.yml) that automatically runs ESLint, executes the full Vitest test suite, compiles the single-file distribution, and publishes it directly to **GitHub Pages** on every push to `main`.

Because the build produces a single self-contained HTML file, you can also open `dist/index.html` directly from your local filesystem as your browser's home page!

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
