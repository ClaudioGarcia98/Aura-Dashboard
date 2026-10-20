import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '../utils/storage';
import { DEFAULT_SETTINGS, readLegacySettings, sanitizeSettings } from './settingsSchema';

const preferenceStorage = {
    ...safeStorage,
    setItem(key, value) {
        // Request status and other ephemeral updates must not rewrite preferences.
        if (safeStorage.getItem(key) !== value) safeStorage.setItem(key, value);
    },
};
function normalizeLofiStation(station) {
    try { return sanitizeSettings({ lofiStations: [station] }, { strict: true }).lofiStations[0]; }
    catch { return null; }
}

export const useSettingsStore = create(
    persist(
        (set, get) => ({
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
            setLanguage:          (language)        => set({ language }),
            setTimeZone:          (timeZone)        => set({ timeZone }),
            setShowJapanTime:     (showJapanTime)   => set({ showJapanTime }),
            setTheme:             (theme)           => set({ theme }),
            setFont:              (font)            => set({ font }),
            setClockMode:         (clockMode)       => set({ clockMode }),
            setUsername:          (username)        => set({ username }),
            setMalUsername:       (malUsername)     => set({ malUsername }),
            setFallbackCity:      (fallbackCity, location = null) => set({ fallbackCity,
                fallbackCityLocation: location ? { city: fallbackCity, lat: location.lat, lon: location.lon } : null }),
            setUse24hClock:       (use24hClock)     => set({ use24hClock }),
            setUseCelsius:        (useCelsius)      => set({ useCelsius }),
            setLofiId:            (lofiId)          => set({ lofiId }),
            setLofiStations:      (lofiStations)    => set({ lofiStations }),
            addLofiStation: station => {
                const next = normalizeLofiStation(station);
                const { lofiStations } = get();
                if (!next || lofiStations.length >= 200 || lofiStations.some(item =>
                    item.videoId === next.videoId || String(item.id) === String(next.id))) return false;
                set({ lofiStations: [...lofiStations, next] });
                return true;
            },
            updateLofiStation: (id, patch) => {
                const { lofiStations, lofiId } = get();
                const existing = lofiStations.find(station => station.id === id);
                if (!existing || !patch || typeof patch !== 'object' || Array.isArray(patch)) return false;
                const next = normalizeLofiStation({ ...existing,
                    ...(Object.hasOwn(patch, 'videoId') ? { videoId: patch.videoId } : {}),
                    ...(Object.hasOwn(patch, 'name') ? { name: patch.name } : {}),
                });
                if (!next || lofiStations.some(station => station.id !== id && station.videoId === next.videoId)) return false;
                set({ lofiStations: lofiStations.map(station => station.id === id ? next : station),
                    lofiId: lofiId === existing.videoId ? next.videoId : lofiId });
                return true;
            },
            removeLofiStation: id => {
                const { lofiStations, lofiId } = get();
                const existing = lofiStations.find(station => station.id === id);
                if (!existing) return false;
                const remaining = lofiStations.filter(station => station.id !== id);
                set({ lofiStations: remaining, lofiId: existing.videoId === lofiId
                    ? remaining[0]?.videoId || DEFAULT_SETTINGS.lofiId : lofiId });
                return true;
            },
            setVolume:            (volume)          => set({ volume }),
            setSpeedDials:        (valOrFn)         => set((state) => {
                const current = Array.isArray(state.speedDials) ? state.speedDials : [];
                const next = typeof valOrFn === 'function' ? valOrFn(current) : valOrFn;
                return { speedDials: Array.isArray(next) ? next : [] };
            }),
            setCustomEngines:     (customEngines)   => set({ customEngines }),
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
            storage: createJSONStorage(() => preferenceStorage),
            migrate: (state) => ({ ...readLegacySettings(safeStorage), ...sanitizeSettings(state) }),
            merge: (persisted, current) => ({ ...current, ...sanitizeSettings(persisted) }),
            partialize: (s) => ({
                language: s.language,
                timeZone: s.timeZone, showJapanTime: s.showJapanTime,
                remoteSuggestions: s.remoteSuggestions, pauseBackground: s.pauseBackground,
                theme: s.theme, font: s.font, clockMode: s.clockMode,
                username: s.username, malUsername: s.malUsername, fallbackCity: s.fallbackCity,
                use24hClock: s.use24hClock, useCelsius: s.useCelsius, gifName: s.gifName,
                fallbackCityLocation: s.fallbackCityLocation,
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
