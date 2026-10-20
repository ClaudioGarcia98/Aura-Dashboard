import { fetchJson } from './http';
import { safeJsonParse, safeStorage } from '../utils/storage';
import { weatherIconType } from '../constants/weather';

const coordinates = (lat, lon) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
const selectedLocation = (city, location) => !!location && location.city === city && coordinates(location.lat, location.lon);
export const weatherCacheKey = (useCelsius, city, location) => JSON.stringify([!!useCelsius, city || '',
    ...(selectedLocation(city, location) ? [location.lat, location.lon] : [])]);
export const WEATHER_REFRESH_MS = 10 * 60 * 1000;
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const validTime = value => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
const validCode = value => Number.isInteger(value) && weatherIconType(value) !== 'unknown';

export function readWeatherCache(key) {
    const data = safeJsonParse(safeStorage.getItem('dash_weather_cache'), null);
    const unit = safeJsonParse(key, [true])?.[0] ? '°C' : '°F';
    const temperature = value => typeof value === 'string' && /^-?\d+(?:\.\d+)?°[CF]$/.test(value) && value.endsWith(unit);
    return data?.key === key && temperature(data.temp) && temperature(data.feelsLike)
        && typeof data.humidity === 'string' && /^\d+(?:\.\d+)?%$/.test(data.humidity) && parseFloat(data.humidity) <= 100
        && typeof data.wind === 'string' && /^\d+(?:\.\d+)? km\/h$/.test(data.wind)
        && [data.sunrise, data.sunset].every(value => value === '--:--' || validTime(value))
        && validCode(data.weatherCode) && typeof data.iconType === 'string'
        && Number.isFinite(data.timestamp) && data.timestamp <= Date.now() && Date.now() - data.timestamp < 86400000
        && Array.isArray(data.forecast) && data.forecast.length <= 3
        && data.forecast.every(day => day && typeof day.day === 'string' && (!day.date || validDate(day.date))
            && Number.isFinite(day.max) && Number.isFinite(day.min) && day.max >= day.min)
        ? { ...data, iconType: weatherIconType(data.weatherCode,
            data.isDay ?? (['moon', 'partly-cloudy-night'].includes(data.iconType) ? 0 : 1)) } : null;
}

function gps(signal) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error('GPS unavailable')); return; }
        let settled = false;
        const finish = (fn, value) => { if (settled) return; settled = true; clearTimeout(timer); signal.removeEventListener('abort', abort); fn(value); };
        const abort = () => finish(reject, signal.reason || new DOMException('Aborted', 'AbortError'));
        const timer = setTimeout(() => finish(reject, new Error('GPS timed out')), 5000);
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) { abort(); return; }
        navigator.geolocation.getCurrentPosition(pos => finish(resolve, pos.coords), error => finish(reject, error), { timeout: 5000, enableHighAccuracy: false });
    });
}

export async function resolveLocation(city, signal, cityLocation) {
    if (signal.aborted) throw signal.reason || new DOMException('Aborted', 'AbortError');
    const selectionKey = weatherCacheKey(true, city, cityLocation);
    const cached = safeJsonParse(safeStorage.getItem('dash_geo'), null);
    if (cached?.selectionKey === selectionKey && coordinates(cached.lat, cached.lon)
        && ['gps', 'ip', 'city', 'default'].includes(cached.source) && Number.isFinite(cached.ts)
        && cached.ts <= Date.now() && Date.now() - cached.ts < WEATHER_REFRESH_MS) return cached;
    let location;
    try {
        const coords = await gps(signal);
        if (coordinates(coords.latitude, coords.longitude)) location = { lat: coords.latitude, lon: coords.longitude, source: 'gps' };
    } catch (error) { if (signal.aborted) throw error; }
    // A configured fallback city is more intentional than an approximate IP location.
    if (!location && city?.trim()) {
        if (selectedLocation(city, cityLocation)) location = { lat: cityLocation.lat, lon: cityLocation.lon, source: 'city' };
        else {
            const parts = city.split(',').map(part => part.trim());
            const data = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(parts[0])}&count=100`, { signal });
            const results = Array.isArray(data.results) ? data.results : [];
            const result = results.find(item => item.name?.toLocaleLowerCase() === parts[0].toLocaleLowerCase()
                && parts.slice(1).every(part => [item.admin1, item.country, item.country_code].some(value => value?.toLocaleLowerCase() === part.toLocaleLowerCase())))
                || (parts.length === 1 ? results[0] : null);
            if (!coordinates(result?.latitude, result?.longitude)) throw new Error('Location unavailable');
            location = { lat: result.latitude, lon: result.longitude, source: 'city' };
        }
    }
    if (!location) {
        try {
            const data = await fetchJson('https://ipapi.co/json/', { signal }, 4000);
            if (coordinates(data.latitude, data.longitude)) location = { lat: data.latitude, lon: data.longitude, source: 'ip' };
        } catch (error) { if (signal.aborted) throw error; }
    }
    if (!location) {
        const name = 'London';
        const data = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`, { signal });
        const result = data.results?.[0];
        if (!coordinates(result?.latitude, result?.longitude)) throw new Error('Location unavailable');
        location = { lat: result.latitude, lon: result.longitude, source: 'default' };
    }
    return { ...location, city, selectionKey, ts: Date.now() };
}

export async function fetchWeatherData(useCelsius, city, signal, cityLocation) {
    const location = await resolveLocation(city, signal, cityLocation);
    const d = await fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}`
        + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day'
        + '&daily=sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4'
        + '&wind_speed_unit=kmh&temperature_unit=' + (useCelsius ? 'celsius' : 'fahrenheit'), { signal });
    const c = d.current;
    if (!c || !['temperature_2m', 'apparent_temperature', 'relative_humidity_2m', 'wind_speed_10m', 'weather_code'].every(key => Number.isFinite(c[key]))) throw new Error('Invalid weather response');
    const unit = useCelsius ? '°C' : '°F';
    if (c.relative_humidity_2m < 0 || c.relative_humidity_2m > 100 || c.wind_speed_10m < 0 || !validCode(c.weather_code)
        || (c.is_day !== undefined && c.is_day !== 0 && c.is_day !== 1)
        || (d.current_units && (d.current_units.temperature_2m !== unit || d.current_units.apparent_temperature !== unit
            || d.current_units.relative_humidity_2m !== '%' || d.current_units.wind_speed_10m !== 'km/h'))) throw new Error('Invalid weather values or units');
    if (d.daily_units && (d.daily_units.temperature_2m_max !== unit || d.daily_units.temperature_2m_min !== unit)) throw new Error('Invalid forecast units');
    const forecast = (Array.isArray(d.daily?.time) ? d.daily.time : []).slice(1, 4).flatMap((date, offset) => {
        const i = offset + 1;
        const max = d.daily.temperature_2m_max?.[i], min = d.daily.temperature_2m_min?.[i];
        if (!validDate(date) || !Number.isFinite(max) || !Number.isFinite(min) || min > max || !validCode(d.daily.weather_code?.[i])) return [];
        return [{ date, day: new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }),
            iconType: weatherIconType(d.daily.weather_code?.[i]), max: Math.round(max), min: Math.round(min) }];
    });
    // Open-Meteo's timezone=auto strings already express the location's wall time.
    const time = value => typeof value === 'string' && validDate(value.slice(0, 10)) && value[10] === 'T' && validTime(value.slice(11, 16)) ? value.slice(11, 16) : '--:--';
    const observedAt = typeof c.time === 'string' && Number.isFinite(d.utc_offset_seconds)
        ? Date.parse(c.time + 'Z') - d.utc_offset_seconds * 1000 : null;
    return { key: weatherCacheKey(useCelsius, city, cityLocation), iconType: weatherIconType(c.weather_code, c.is_day), weatherCode: c.weather_code, isDay: c.is_day,
        temp: Math.round(c.temperature_2m) + unit, feelsLike: Math.round(c.apparent_temperature) + unit,
        humidity: c.relative_humidity_2m + '%', wind: Math.round(c.wind_speed_10m * 10) / 10 + ' km/h',
        sunrise: time(d.daily?.sunrise?.[0]), sunset: time(d.daily?.sunset?.[0]), forecast,
        timestamp: Date.now(), observedAt: Number.isFinite(observedAt) ? observedAt : null,
        timeZone: d.timezone, location, locationSource: location.source };
}
