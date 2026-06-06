# Responsiveness Plan - Good Morning Dashboard

This document outlines the layout modifications and component-specific stylesheet changes required to make the dashboard fully responsive across desktop, tablet, and mobile screen sizes.

---

## 1. Global Layout Adjustments

To prevent elements from clipping or overlapping on smaller screens, we will transition from a locked, absolute 100vh viewport to a flexible vertical scrolling flow on mobile viewports.

### Global Styles (`src/index.css`)
* **Under `@media (max-width: 768px)`**:
  * Set `body` to:
    ```css
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
    padding: 0;
    ```
  * Update `.interactive-ui` to allow proper vertical scrolling:
    ```css
    position: relative;
    height: auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    padding: 64px 16px 140px 16px;
    overflow-x: hidden;
    ```
  * Update `.container` to center-align horizontally and remove the large left margin:
    ```css
    margin: 0 auto;
    width: 100%;
    max-width: 100%;
    max-height: none;
    padding: var(--space-3);
    ```
  * Clean up legacy `.sidebar` and `.bottom-widgets` styling overrides to avoid styling conflicts.

---

## 2. Component Stylesheets

### Typography (`src/components/Clock.css` & `src/components/Greeting.css`)
* **Under `@media (max-width: 768px)`**:
  * Scale down typography sizes using direct ID selectors to ensure desktop styles are overridden cleanly:
    * `#time { font-size: 3.5rem; letter-spacing: -1.5px; }`
    * `#ampm { font-size: 1.25rem; margin-bottom: 6px; }`
    * `#date { font-size: 1.1rem; margin-bottom: var(--space-2); }`
    * `#greeting { font-size: 1.1rem; letter-spacing: 2px; }`

### Weather Widget (`src/components/WeatherWidget.css`)
* **Under `@media (max-width: 768px)`**:
  * Scale down padding and position the floating weather widget button relative to the top corner:
    ```css
    .weather-widget {
        top: 12px;
        right: 12px;
        padding: 6px 12px;
        font-size: 0.85rem;
    }
    ```
  * Adjust the extended weather panel position to stay aligned with the widget on small screens:
    ```css
    .weather-panel {
        top: 56px;
        right: 12px;
        width: 240px;
    }
    ```

### Anime Schedule (`src/components/AnimeSchedule/AnimeSchedule.css`)
* **Under `@media (max-width: 1024px)`** (handles mobile and tablet portrait screen widths):
  * Make the schedule sidebar expand to a full-screen drawer rather than a fixed width:
    ```css
    .anime-sidebar {
        width: 100vw;
        right: -100vw;
        border-left: none;
    }
    .anime-sidebar.open {
        right: 0;
    }
    ```
  * Position the trigger button in the bottom-right corner:
    ```css
    .anime-toggle {
        bottom: 16px;
        right: 16px;
        width: 44px;
        height: 44px;
    }
    ```
  * Fade out the toggle trigger when the sidebar drawer is open to prevent visual overlap:
    ```css
    .anime-toggle.open {
        opacity: 0;
        pointer-events: none;
    }
    ```
  * Adjust card horizontal padding and content scroll limits to optimize space on touch screens.

### Settings Panel (`src/components/SettingsPanel/SettingsPanel.css`)
* **Under `@media (max-width: 768px)`**:
  * Position the toggle trigger button on the bottom left corner:
    ```css
    .settings-toggle {
        bottom: 16px;
        left: 16px;
        width: 44px;
        height: 44px;
    }
    ```
  * Center the settings panel drawer horizontally and slide it up above the bottom screen edge:
    ```css
    .settings-panel {
        left: 50%;
        bottom: 76px;
        width: calc(100% - 32px);
        max-width: 360px;
        max-height: 70vh;
        transform: translateX(-50%) translateY(16px);
    }
    .settings-panel.open {
        transform: translateX(-50%) translateY(0);
    }
    ```

### Lofi Player (`src/components/LofiPlayer.css`)
* **Under `@media (max-width: 768px)`**:
  * Position the player centered above the bottom toggle buttons to prevent overlaps:
    ```css
    .lofi-player {
        bottom: 76px;
        left: 50%;
        transform: translateX(-50%);
    }
    ```
  * Adjust volume controls and sizing slightly to fit narrower screens.

---

## 3. Verification Plan

### Automated Tests
* Validate that CSS changes do not impact compilation or functional unit tests:
  `cmd /c npm run build`

### Manual Verification
* Run local development server: `cmd /c npm run dev`.
* Resize browser window to Mobile portrait (`360px` - `480px`) and Tablet portrait (`768px` - `1024px`).
* Verify:
  * No visual overlap between Settings Panel toggle, Anime Schedule toggle, and Lofi Player.
  * Clock, greeting, date, and weather are scaled down and clear of each other.
  * Settings Panel opens centered, doesn't overflow horizontally, and scrolls vertically.
  * Anime Schedule sidebar opens full-screen on mobile and closes cleanly.
  * Search Box suggestions do not overflow off-screen.
  * Entire dashboard page is scrollable if widgets overflow.
