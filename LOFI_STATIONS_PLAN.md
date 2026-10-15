# Lofi Stations Feature Plan - Multiple Custom Stations

This document outlines the plan to extend the single custom lofi station setting into an add/remove/reorder list of custom stations, matching the design of the Speed Dials feature.

## 1. Store Management Updates (`src/stores/useSettingsStore.js`)
* **New State**:
  * Add `customLofiStations` initialized by reading `dash_custom_lofi_stations`.
  * Fallback/migration: If `dash_custom_lofi_stations` doesn't exist but a legacy `dash_custom_lofi` exists, initialize the list with `{ id: legacy, name: 'My Saved Station' }`.
* **New Action**:
  * Add `setCustomLofiStations(stations)`.
* **Persistence Filter**:
  * Include `customLofiStations` in the `persist` middleware's `partialize` filter.

---

## 2. Settings User Interface (`src/components/SettingsPanel/MediaSettings.jsx`)
Replace the single lofi input with a list management UI:
* **Add Form**: Input fields for YouTube Video ID/URL and an optional Station Name.
* **Station List**: Render all saved custom stations.
* **Inline Edit**: Allow editing the name and Video ID/URL of any saved station.
* **Remove Action**: Delete a station from the list.
* **Reorder Action**: Add up and down arrow buttons next to each item to shift its index in the array.

---

## 3. Lofi Player Component (`src/components/LofiPlayer.jsx`)
* **Merged Stations List**:
  * Update `stationsList` to combine all custom stations (`customLofiStations`) at the top, followed by the default built-in stations.
  * Ensure the currently active `lofiId` checks the custom list for custom names, fallback to fetching the YouTube title if it is a custom station without a set name, or the default name if it is a built-in station.

---

## 4. How to Verify
* Run unit tests: `cmd /c npm run test` to verify no regressions.
* Run production build: `cmd /c npm run build`.
* Manual test: Open the Settings Panel -> Media tab, add multiple stations, reorder them, play them in LofiPlayer, and delete them.
