# Test Coverage Manifest & Checklist

This file contains a manifest of all components, utilities, hooks, and services that lack direct test coverage files in the repository.

## Components
- [x] `src/App.jsx` (Core orchestrator component; test file at `src/__tests__/App.test.jsx`)
- [x] `src/components/AnimeSchedule/AnimeCard.jsx` (Sub-component of AnimeSchedule; test file at `src/components/AnimeSchedule/__tests__/AnimeCard.test.jsx`)
- [x] `src/components/AnimeSchedule/Sidebar.jsx` (Sub-component of AnimeSchedule; test file at `src/components/AnimeSchedule/__tests__/Sidebar.test.jsx`)
- [x] `src/components/AnimeSchedule/TrailerPreview.jsx` (Sub-component of AnimeSchedule; test file at `src/components/AnimeSchedule/__tests__/TrailerPreview.test.jsx`)
- [x] `src/components/ErrorBoundary.jsx` (Error boundary component; test file at `src/components/ErrorBoundary.test.jsx`)
- [x] `src/components/SettingsPanel/ThemeSettings.jsx` (Settings theme switcher; test file at `src/components/SettingsPanel/ThemeSettings.test.jsx`)
- [x] `src/components/SettingsPanel/index.jsx` (Settings panel modal; test file at `src/components/SettingsPanel/SettingsPanel.test.jsx`)

## Hooks
- [x] `src/hooks/useAnimeSchedule.js` (Schedule hook; test file at `src/hooks/__tests__/useAnimeSchedule.test.js`)
- [x] `src/hooks/useBackgroundLoader.js` (Loads background assets from IndexedDB; test file at `src/hooks/__tests__/useBackgroundLoader.test.js`)
- [x] `src/hooks/useFontEffect.js` (Applies dynamic font styles/links to document head; test file at `src/hooks/__tests__/useFontEffect.test.js`)
- [x] `src/hooks/useThemeEffect.js` (Applies time-based and static theme variables; test file at `src/hooks/__tests__/useThemeEffect.test.js`)

## Stores & Contexts
- [x] `src/stores/useSettingsStore.js` (Zustand settings store; dedicated test file at `src/stores/__tests__/useSettingsStore.test.js`)
- [x] `src/constants/settingsConstants.js` (Theme and font definitions constants; test file at `src/constants/__tests__/settingsConstants.test.js`)

## Services & Utilities
- [x] `src/services/db.js` (Unified IndexedDB media storage service; test file at `src/services/db.test.js`)
- [x] `src/utils/storage.js` (Safe JSON serialization utilities; test file at `src/utils/__tests__/storage.test.js`)

## Entry Point
- [x] `src/main.jsx` (Application bootstrap and DOM mounting entry point; test file at `src/__tests__/main.test.jsx`)
