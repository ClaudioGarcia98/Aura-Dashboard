import { useEffect, useRef, useState } from 'react';
import { fetchWeatherData, readWeatherCache, weatherCacheKey, WEATHER_REFRESH_MS } from '../services/weather';
import { safeStorage } from '../utils/storage';

export function useWeather(useCelsius, fallbackCity, cityLocation) {
    const key = weatherCacheKey(useCelsius, fallbackCity, cityLocation);
    const [state, setState] = useState(() => ({ key, data: readWeatherCache(key), error: false, stale: !!readWeatherCache(key) }));
    const refreshRef = useRef(null);
    useEffect(() => {
        let active = true, generation = 0, timer, controller;
        let current = readWeatherCache(key);
        let delay = 60000;
        const refresh = async () => {
            const request = ++generation;
            clearTimeout(timer); controller?.abort(); controller = new AbortController();
            try {
                const data = await fetchWeatherData(useCelsius, fallbackCity, controller.signal, cityLocation);
                if (!active || request !== generation) return;
                current = data; delay = 60000;
                setState({ key, data, error: false, stale: false });
                safeStorage.setItem('dash_weather_cache', JSON.stringify(data));
                safeStorage.setItem('dash_geo', JSON.stringify(data.location));
                window.dispatchEvent(new CustomEvent('weather-update', { detail: data.weatherCode }));
                timer = setTimeout(refresh, WEATHER_REFRESH_MS);
            } catch {
                if (!active || request !== generation) return;
                setState({ key, data: current, error: !current, stale: !!current });
                timer = setTimeout(refresh, delay); delay = Math.min(delay * 2, 600000);
            }
        };
        refreshRef.current = refresh;
        refresh();
        const resume = () => {
            if (document.visibilityState === 'hidden') return;
            if (!current || Date.now() - current.timestamp >= WEATHER_REFRESH_MS) refresh();
        };
        window.addEventListener('online', refresh);
        window.addEventListener('focus', resume);
        document.addEventListener('visibilitychange', resume);
        return () => {
            active = false; controller?.abort(); clearTimeout(timer);
            window.removeEventListener('online', refresh);
            window.removeEventListener('focus', resume);
            document.removeEventListener('visibilitychange', resume);
        };
    }, [key, useCelsius, fallbackCity, cityLocation]);
    const current = state.key === key ? state : { data: readWeatherCache(key), error: false, stale: true };
    return { weather: current.data, error: current.error, isOffline: current.stale,
        isFallback: !!current.data && current.data.locationSource !== 'gps', fetchWeatherRef: refreshRef };
}
