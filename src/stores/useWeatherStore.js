import { create } from 'zustand';
import { readWeatherCache, WEATHER_REFRESH_MS } from '../services/weather';

// Request ownership stays in useWeather. Other widgets consume its validated result
// without starting duplicate location/API requests or reading unvalidated storage.
export const useWeatherStore = create(() => ({ snapshot: null }));

export function readCurrentWeather(key, enabled = true) {
    if (!enabled) return null;
    const snapshot = useWeatherStore.getState().snapshot;
    const data = snapshot?.key === key ? (snapshot.stale ? null : snapshot.data) : readWeatherCache(key);
    return data?.key === key && Number.isFinite(data.timestamp) && data.timestamp <= Date.now()
        && Date.now() - data.timestamp < WEATHER_REFRESH_MS ? data : null;
}
