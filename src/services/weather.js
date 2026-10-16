import { fetchJson } from './http';
import { safeJsonParse, safeStorage } from '../utils/storage';
import { weatherIconType } from '../constants/weather';

export const weatherCacheKey = (useCelsius, city) => JSON.stringify([!!useCelsius, city || '']);

export function readWeatherCache(key) {
    const data = safeJsonParse(safeStorage.getItem('dash_weather_cache'), null);
    return data?.key === key && typeof data.temp === 'string' && typeof data.feelsLike === 'string'
        && Number.isFinite(data.timestamp) && Array.isArray(data.forecast)
        && data.forecast.every(day => day && typeof day.day === 'string' && Number.isFinite(day.max) && Number.isFinite(day.min)) ? data : null;
}

function gps(signal) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error('GPS unavailable')); return; }
        const finish = (fn, value) => { clearTimeout(timer); signal.removeEventListener('abort', abort); fn(value); };
        const abort = () => finish(reject, signal.reason || new DOMException('Aborted', 'AbortError'));
        const timer = setTimeout(() => finish(reject, new Error('GPS timed out')), 5000);
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) { abort(); return; }
        navigator.geolocation.getCurrentPosition(pos => finish(resolve, pos.coords), error => finish(reject, error), { timeout: 5000, enableHighAccuracy: false });
    });
}

const coordinates = (lat, lon) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

export async function resolveLocation(city, signal) {
    const cached = safeJsonParse(safeStorage.getItem('dash_geo'), null);
    if (cached?.city === city && coordinates(cached.lat, cached.lon) && Date.now() - cached.ts < 3600000) return cached;
    let location;
    try {
        const coords = await gps(signal);
        if (coordinates(coords.latitude, coords.longitude)) location = { lat: coords.latitude, lon: coords.longitude, source: 'gps' };
    } catch (error) { if (signal.aborted) throw error; }
    if (!location) {
        try {
            const data = await fetchJson('https://ipapi.co/json/', { signal }, 4000);
            if (coordinates(data.latitude, data.longitude)) location = { lat: data.latitude, lon: data.longitude, source: 'ip' };
        } catch (error) { if (signal.aborted) throw error; }
    }
    if (!location) {
        const name = (city || 'London').split(',')[0].trim();
        const data = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`, { signal });
        const result = data.results?.[0];
        if (!coordinates(result?.latitude, result?.longitude)) throw new Error('Location unavailable');
        location = { lat: result.latitude, lon: result.longitude, source: 'city' };
    }
    return { ...location, city, ts: Date.now() };
}

export async function fetchWeatherData(useCelsius, city, signal) {
    const location = await resolveLocation(city, signal);
    const d = await fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}`
        + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code'
        + '&daily=sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4'
        + (useCelsius ? '' : '&temperature_unit=fahrenheit'), { signal });
    const c = d.current;
    if (!c || !['temperature_2m', 'apparent_temperature', 'relative_humidity_2m', 'wind_speed_10m', 'weather_code'].every(key => Number.isFinite(c[key]))) throw new Error('Invalid weather response');
    const forecast = (d.daily?.time || []).slice(1, 4).flatMap((date, offset) => {
        const i = offset + 1;
        const max = d.daily.temperature_2m_max?.[i], min = d.daily.temperature_2m_min?.[i];
        if (!Number.isFinite(max) || !Number.isFinite(min)) return [];
        return [{ day: new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }),
            iconType: weatherIconType(d.daily.weather_code?.[i]), max: Math.round(max), min: Math.round(min) }];
    });
    const unit = useCelsius ? '°C' : '°F';
    // Open-Meteo's timezone=auto strings already express the location's wall time.
    const time = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) ? value.slice(11, 16) : '--:--';
    return { key: weatherCacheKey(useCelsius, city), iconType: weatherIconType(c.weather_code), weatherCode: c.weather_code,
        temp: Math.round(c.temperature_2m) + unit, feelsLike: Math.round(c.apparent_temperature) + unit,
        humidity: c.relative_humidity_2m + '%', wind: Math.round(c.wind_speed_10m) + ' km/h',
        sunrise: time(d.daily?.sunrise?.[0]), sunset: time(d.daily?.sunset?.[0]), forecast,
        timestamp: Date.now(), location, locationSource: location.source };
}
