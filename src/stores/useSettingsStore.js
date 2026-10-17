import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '../utils/storage';
import { DEFAULT_SETTINGS, readLegacySettings, sanitizeSettings } from './settingsSchema';

export const useSettingsStore = create(
    persist(
        (set) => ({
            ...DEFAULT_SETTINGS,
            ...readLegacySettings(safeStorage),

            // Ephemeral — not persisted
            backgroundUrl:    null,
            backgroundIsVideo: false,
            malStatus: 'idle',
            malSavedAt: null,
            malRefreshKey: 0,
            refreshMal: () => set(state => ({ malRefreshKey: state.malRefreshKey + 1 })),
            setMalStatus: (malStatus) => set({ malStatus }),
            setMalSavedAt: (malSavedAt) => set({ malSavedAt }),
            malError:         false,
            malLoading:       false,
            malSuccess:       false,

            setRemoteSuggestions: (remoteSuggestions) => set({ remoteSuggestions }),
            setPauseBackground: (pauseBackground) => set({ pauseBackground }),
            // Actions
            setTheme:             (theme)           => set({ theme }),
            setFont:              (font)            => set({ font }),
            setClockMode:         (clockMode)       => set({ clockMode }),
            setUsername:          (username)        => set({ username }),
            setMalUsername:       (malUsername)     => set({ malUsername }),
            setFallbackCity:      (fallbackCity)    => set({ fallbackCity }),
            setUse24hClock:       (use24hClock)     => set({ use24hClock }),
            setUseCelsius:        (useCelsius)      => set({ useCelsius }),
            setGifName:           (gifName)         => set({ gifName }),
            setLofiId:            (lofiId)          => set({ lofiId }),
            setLofiStations:      (lofiStations)    => set({ lofiStations }),
            setVolume:            (volume)          => set({ volume }),
            setSpeedDials:        (valOrFn)         => set((state) => {
                const current = Array.isArray(state.speedDials) ? state.speedDials : [];
                const next = typeof valOrFn === 'function' ? valOrFn(current) : valOrFn;
                return { speedDials: Array.isArray(next) ? next : [] };
            }),
            setCustomEngines:     (customEngines)   => set({ customEngines }),
            setBackgroundUrl:     (backgroundUrl)   => set({ backgroundUrl }),
            setBackgroundIsVideo: (backgroundIsVideo) => set({ backgroundIsVideo }),
            setMalError:          (malError)        => set({ malError }),
            setMalLoading:        (malLoading)      => set({ malLoading }),
            setMalSuccess:        (malSuccess)      => set({ malSuccess }),
            setShowWeatherWidget: (v) => set({ showWeatherWidget: v }),
            setShowQuote:         (v) => set({ showQuote: v }),
            setShowSearchBox:     (v) => set({ showSearchBox: v }),
            setShowSpeedDial:     (v) => set({ showSpeedDial: v }),
            setShowTop5Anime:     (v) => set({ showTop5Anime: v }),
            setShowAnimeSidebar:  (v) => set({ showAnimeSidebar: v }),
            setShowLofiPlayer:    (v) => set({ showLofiPlayer: v }),
            setShowFocusWidget:   (v) => set({ showFocusWidget: v }),
        }),
        {
            name: 'dash_settings',
            version: 1,
            storage: createJSONStorage(() => safeStorage),
            migrate: (state) => ({ ...readLegacySettings(safeStorage), ...sanitizeSettings(state) }),
            merge: (persisted, current) => ({ ...current, ...sanitizeSettings(persisted) }),
            partialize: (s) => ({
                remoteSuggestions: s.remoteSuggestions, pauseBackground: s.pauseBackground,
                theme: s.theme, font: s.font, clockMode: s.clockMode,
                username: s.username, malUsername: s.malUsername, fallbackCity: s.fallbackCity,
                use24hClock: s.use24hClock, useCelsius: s.useCelsius, gifName: s.gifName,
                lofiId: s.lofiId, lofiStations: s.lofiStations, volume: s.volume,
                speedDials: s.speedDials, customEngines: s.customEngines,
                showWeatherWidget: s.showWeatherWidget, showQuote: s.showQuote,
                showSearchBox: s.showSearchBox, showSpeedDial: s.showSpeedDial,
                showTop5Anime: s.showTop5Anime, showAnimeSidebar: s.showAnimeSidebar,
                showLofiPlayer: s.showLofiPlayer,
                showFocusWidget: s.showFocusWidget,
            }),
        }
    )
);
