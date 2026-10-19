import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { fetchWeatherData, weatherCacheKey, readWeatherCache, resolveLocation, WEATHER_REFRESH_MS } from './weather';
import { weatherIconType, weatherConditionLabel } from '../constants/weather';
import { sanitizeSettings } from '../stores/settingsSchema';
import { useWeather } from '../hooks/useWeather';

const rawWeather = temp => ({ current: { temperature_2m: temp, apparent_temperature: temp - 1, relative_humidity_2m: 50, wind_speed_10m: 5, weather_code: 85 },
    daily: { time: ['2026-10-16', '2026-10-17'], sunrise: ['2026-10-16T06:12'], sunset: ['2026-10-16T18:09'], temperature_2m_max: [20, 21], temperature_2m_min: [10, 11], weather_code: [85, 86] } });
const response = data => ({ ok: true, json: async () => data });
beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: success => success({ coords: { latitude: 0, longitude: 0 } }) } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(rawWeather(20))));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

it('accepts zero coordinates and correctly maps snow showers in both current and forecast data', async () => {
    const data = await fetchWeatherData(true, 'London', new AbortController().signal);
    expect(data.location).toMatchObject({ lat: 0, lon: 0, source: 'gps' });
    expect(data.iconType).toBe('snow');
    expect(data.forecast[0].iconType).toBe('snow');
    expect(data.sunrise).toBe('06:12');
});
it.each([response({ error: true }), { ok: false, status: 503, json: async () => ({}) }])('rejects malformed/unsuccessful responses rather than staying loading', async res => {
    fetch.mockResolvedValue(res);
    await expect(fetchWeatherData(true, '', new AbortController().signal)).rejects.toThrow();
});
it('rejects a cache belonging to different units or city', () => {
    localStorage.setItem('dash_weather_cache', JSON.stringify({ key: weatherCacheKey(true, 'London'), temp: '20°C', feelsLike: '19°C', timestamp: Date.now(), forecast: [] }));
    expect(readWeatherCache(weatherCacheKey(false, 'London'))).toBeNull();
    expect(readWeatherCache(weatherCacheKey(true, 'Paris'))).toBeNull();
});
it('does not let an old Celsius response overwrite a newer Fahrenheit result', async () => {
    let finishOld;
    fetch.mockImplementation(url => url.includes('fahrenheit') ? Promise.resolve(response(rawWeather(68))) : new Promise(resolve => { finishOld = resolve; }));
    const { result, rerender } = renderHook(({ celsius }) => useWeather(celsius, 'London'), { initialProps: { celsius: true } });
    await waitFor(() => expect(finishOld).toBeTypeOf('function'));
    rerender({ celsius: false });
    await waitFor(() => expect(result.current.weather?.temp).toBe('68°F'));
    await act(async () => { finishOld(response(rawWeather(20))); });
    expect(result.current.weather.temp).toBe('68°F');
    expect(JSON.parse(localStorage.getItem('dash_weather_cache')).key).toBe(weatherCacheKey(false, 'London'));
});
it('keeps matching cached data visible and marks it stale on failure', async () => {
    const data = await fetchWeatherData(true, 'London', new AbortController().signal);
    localStorage.setItem('dash_weather_cache', JSON.stringify(data));
    fetch.mockRejectedValue(new Error('Offline'));
    const { result } = renderHook(() => useWeather(true, 'London'));
    await waitFor(() => expect(result.current.isOffline).toBe(true));
    expect(result.current.weather.temp).toBe('20°C');
});

it('uses the provider feels-like value, explicit units, decimal wind and location-local solar times', async () => {
    const raw = rawWeather(-3.6);
    Object.assign(raw.current, { apparent_temperature: -9.2, wind_speed_10m: 12.7, relative_humidity_2m: 0,
        time: '2026-10-19T09:15', is_day: 0, weather_code: 0 });
    Object.assign(raw, { timezone: 'Asia/Tokyo', utc_offset_seconds: 32400,
        current_units: { temperature_2m: '°C', apparent_temperature: '°C', wind_speed_10m: 'km/h', relative_humidity_2m: '%' } });
    fetch.mockResolvedValue(response(raw));
    const result = await fetchWeatherData(true, '', new AbortController().signal);
    expect(result).toMatchObject({ temp: '-4°C', feelsLike: '-9°C', humidity: '0%', wind: '12.7 km/h',
        sunrise: '06:12', sunset: '18:09', iconType: 'moon', observedAt: Date.parse('2026-10-19T00:15:00Z'), timeZone: 'Asia/Tokyo' });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.searchParams.get('temperature_unit')).toBe('celsius');
    expect(url.searchParams.get('wind_speed_unit')).toBe('kmh');
    expect(url.searchParams.get('timezone')).toBe('auto');
});

it.each([
    ['relative_humidity_2m', -1], ['relative_humidity_2m', 101], ['wind_speed_10m', -1],
    ['temperature_2m', null], ['apparent_temperature', NaN], ['weather_code', 46], ['is_day', 2],
])('rejects invalid %s=%s instead of displaying misleading numbers', async (field, value) => {
    const raw = rawWeather(20);
    raw.current[field] = value;
    fetch.mockResolvedValue(response(raw));
    await expect(fetchWeatherData(true, '', new AbortController().signal)).rejects.toThrow();
});

it('rejects a response in the wrong units', async () => {
    fetch.mockResolvedValue(response({ ...rawWeather(20), current_units: {
        temperature_2m: '°F', apparent_temperature: '°F', relative_humidity_2m: '%', wind_speed_10m: 'mph',
    } }));
    await expect(fetchWeatherData(true, '', new AbortController().signal)).rejects.toThrow('units');
});

it('does not render invalid forecast dates, inverted ranges, or invalid solar times', async () => {
    const raw = rawWeather(20);
    raw.daily.time[1] = '2026-02-30';
    raw.daily.sunrise[0] = '2026-10-16T99:99';
    raw.daily.sunset[0] = null;
    fetch.mockResolvedValue(response(raw));
    expect(await fetchWeatherData(true, '', new AbortController().signal)).toMatchObject({ forecast: [], sunrise: '--:--', sunset: '--:--' });
    raw.daily.time[1] = '2026-10-17';
    raw.daily.temperature_2m_min[1] = 50;
    expect((await fetchWeatherData(true, '', new AbortController().signal)).forecast).toEqual([]);
});

it.each([
    ['Europe/Lisbon', ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'], ['Tue', 'Wed', 'Thu']],
    ['Pacific/Kiritimati', ['2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03'], ['Fri', 'Sat', 'Sun']],
    ['Pacific/Honolulu', ['2028-02-28', '2028-02-29', '2028-03-01', '2028-03-02'], ['Tue', 'Wed', 'Thu']],
])('keeps the next three location-local dates aligned with their highs, lows and daily icons in %s', async (zone, dates, weekdays) => {
    const raw = rawWeather(21);
    raw.timezone = zone;
    raw.current.is_day = 0;
    raw.daily = { time: dates, temperature_2m_max: [99, 18.2, 18.4, 20.1],
        temperature_2m_min: [-99, 10.1, 11.2, 8.3], weather_code: [95, 0, 1, 3] };
    fetch.mockResolvedValue(response(raw));
    const data = await fetchWeatherData(true, '', new AbortController().signal);
    expect(data.forecast).toEqual([
        { date: dates[1], day: weekdays[0], max: 18, min: 10, iconType: 'sun' },
        { date: dates[2], day: weekdays[1], max: 18, min: 11, iconType: 'sun' },
        { date: dates[3], day: weekdays[2], max: 20, min: 8, iconType: 'cloud' },
    ]);
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.searchParams.get('forecast_days')).toBe('4');
    expect(url.searchParams.get('timezone')).toBe('auto');
});

it('uses Fahrenheit forecast highs and lows from the API without converting them a second time', async () => {
    const raw = rawWeather(70);
    raw.daily = { time: ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'],
        temperature_2m_max: [75, 64.8, 65.1, 68.2], temperature_2m_min: [55, 50.2, 52.2, 46.9],
        weather_code: [0, 2, 61, 85] };
    raw.daily_units = { temperature_2m_max: '°F', temperature_2m_min: '°F' };
    fetch.mockResolvedValue(response(raw));
    const data = await fetchWeatherData(false, '', new AbortController().signal);
    expect(data.forecast.map(({ max, min, iconType }) => ({ max, min, iconType }))).toEqual([
        { max: 65, min: 50, iconType: 'partly-cloudy' },
        { max: 65, min: 52, iconType: 'rain' },
        { max: 68, min: 47, iconType: 'snow' },
    ]);
    expect(fetch.mock.calls[0][0]).toContain('temperature_unit=fahrenheit');
    raw.daily_units.temperature_2m_min = '°C';
    await expect(fetchWeatherData(false, '', new AbortController().signal)).rejects.toThrow('Invalid forecast units');
});

it('uses the exact selected fallback coordinates ahead of IP when GPS is unavailable', async () => {
    vi.stubGlobal('navigator', {});
    const city = 'Springfield, Oregon, United States';
    const selection = { city, lat: 44.0462, lon: -123.022 };
    const data = await fetchWeatherData(true, city, new AbortController().signal, selection);
    expect(data.location).toMatchObject({ lat: selection.lat, lon: selection.lon, source: 'city' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain('latitude=44.0462&longitude=-123.022');
    expect(data.key).not.toBe(weatherCacheKey(true, city));
});

it('resolves legacy city names using the saved country and region instead of the first namesake', async () => {
    vi.stubGlobal('navigator', {});
    fetch.mockResolvedValue(response({ results: [
        { name: 'Springfield', admin1: 'Illinois', country: 'United States', latitude: 39.8, longitude: -89.6 },
        { name: 'Springfield', admin1: 'Oregon', country: 'United States', latitude: 44.0462, longitude: -123.022 },
    ] }));
    expect(await resolveLocation('Springfield, Oregon, United States', new AbortController().signal)).toMatchObject({ lat: 44.0462, source: 'city' });
    expect(fetch).toHaveBeenCalledTimes(1);
});

it('keeps GPS first and falls back to IP, then an explicitly marked default without a configured city', async () => {
    const signal = new AbortController().signal;
    expect((await resolveLocation('Paris', signal, { city: 'Paris', lat: 48.8, lon: 2.3 })).source).toBe('gps');
    vi.stubGlobal('navigator', {});
    fetch.mockResolvedValueOnce(response({ latitude: 48.8, longitude: 2.3 }));
    expect((await resolveLocation('', signal)).source).toBe('ip');
    fetch.mockRejectedValueOnce(new Error('IP unavailable')).mockResolvedValueOnce(response({ results: [{ latitude: 51.5, longitude: -0.1 }] }));
    expect((await resolveLocation('', signal)).source).toBe('default');
});

it('rejects unmatched cities and honours cancellation without falling through to another location', async () => {
    vi.stubGlobal('navigator', {});
    fetch.mockResolvedValue(response({ results: [] }));
    await expect(resolveLocation('Unknown, Country', new AbortController().signal)).rejects.toThrow('Location unavailable');
    expect(fetch).toHaveBeenCalledTimes(1);
    const controller = new AbortController();
    controller.abort();
    await expect(resolveLocation('', controller.signal)).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
});

it('expires cached locations and does not reuse a different selected coordinate', async () => {
    vi.useFakeTimers();
    const location = await resolveLocation('London', new AbortController().signal);
    localStorage.setItem('dash_geo', JSON.stringify(location));
    const gps = vi.fn(success => success({ coords: { latitude: 1, longitude: 2 } }));
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: gps } });
    expect((await resolveLocation('London', new AbortController().signal)).lat).toBe(0);
    await vi.advanceTimersByTimeAsync(WEATHER_REFRESH_MS);
    expect((await resolveLocation('London', new AbortController().signal)).lat).toBe(1);
    expect(gps).toHaveBeenCalledTimes(1);
});

it('rejects incomplete, expired, future-dated and corrupt weather caches', async () => {
    const data = await fetchWeatherData(true, 'London', new AbortController().signal);
    for (const change of [{ timestamp: Date.now() - 86400001 }, { timestamp: Date.now() + 60000 },
        { humidity: '101%' }, { wind: '-5 km/h' }, { temp: '68°F' }, { sunset: '99:99' },
        { forecast: [{ day: 'Mon', date: 'bad', max: 20, min: 10 }] }]) {
        localStorage.setItem('dash_weather_cache', JSON.stringify({ ...data, ...change }));
        expect(readWeatherCache(data.key)).toBeNull();
    }
    localStorage.setItem('dash_weather_cache', JSON.stringify(data));
    expect(readWeatherCache(data.key)).toMatchObject({ temp: '20°C' });
});

it.each([[0, 'sun', 'Clear'], [1, 'sun', 'Mainly clear'], [2, 'partly-cloudy', 'Partly cloudy'], [3, 'cloud', 'Cloudy'],
    [45, 'fog', 'Fog'], [48, 'fog', 'Fog'], [51, 'rain', 'Drizzle'], [56, 'rain', 'Freezing drizzle'],
    [66, 'rain', 'Freezing rain'], [81, 'rain', 'Rain'], [86, 'snow', 'Snow'], [97, 'storm', 'Storm'], [99, 'storm', 'Storm'],
    [46, 'unknown', 'Weather']])('maps WMO code %s to the correct icon and condition', (code, icon, label) => {
    expect(weatherIconType(code)).toBe(icon);
    expect(weatherConditionLabel(code)).toBe(label);
});

it('uses moon icons for clear and mainly clear nights and preserves clouds for partly cloudy nights', () => {
    expect(weatherIconType(0, 0)).toBe('moon');
    expect(weatherIconType(1, 0)).toBe('moon');
    expect(weatherIconType(2, 0)).toBe('partly-cloudy-night');
});

it('corrects the old mainly-clear cloud icon when reading saved weather', async () => {
    const data = await fetchWeatherData(true, 'London', new AbortController().signal);
    localStorage.setItem('dash_weather_cache', JSON.stringify({ ...data, weatherCode: 1, iconType: 'partly-cloudy' }));
    expect(readWeatherCache(data.key).iconType).toBe('sun');
    localStorage.setItem('dash_weather_cache', JSON.stringify({ ...data, weatherCode: 1, iconType: 'partly-cloudy-night' }));
    expect(readWeatherCache(data.key).iconType).toBe('moon');
});

it('keeps selected city coordinates through validation and rejects invalid settings', () => {
    const value = { city: 'Paris', lat: 48.8, lon: 2.3 };
    expect(sanitizeSettings({ fallbackCityLocation: value }, { strict: true })).toEqual({ fallbackCityLocation: value });
    expect(() => sanitizeSettings({ fallbackCityLocation: { ...value, lat: 100 } }, { strict: true })).toThrow();
});

it('refreshes stale conditions on returning to the tab, but avoids refetching fresh data', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useWeather(true, 'London'));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(result.current.weather.temp).toBe('20°C');
    expect(fetch).toHaveBeenCalledTimes(1);
    act(() => window.dispatchEvent(new Event('focus')));
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + WEATHER_REFRESH_MS + 1);
    fetch.mockResolvedValue(response(rawWeather(22)));
    await act(async () => { window.dispatchEvent(new Event('focus')); await vi.advanceTimersByTimeAsync(0); });
    expect(result.current.weather.temp).toBe('22°C');
    expect(fetch).toHaveBeenCalledTimes(2);
});

it('retries after a failed refresh, recovers online and removes listeners on unmount', async () => {
    vi.useFakeTimers();
    fetch.mockRejectedValue(new Error('Offline'));
    const { result, unmount } = renderHook(() => useWeather(true, 'London'));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(result.current.error).toBe(true);
    fetch.mockResolvedValue(response(rawWeather(23)));
    await act(async () => { window.dispatchEvent(new Event('online')); await vi.advanceTimersByTimeAsync(0); });
    expect(result.current.weather.temp).toBe('23°C');
    expect(result.current.error).toBe(false);
    const calls = fetch.mock.calls.length;
    unmount();
    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('focus'));
    await vi.advanceTimersByTimeAsync(WEATHER_REFRESH_MS);
    expect(fetch).toHaveBeenCalledTimes(calls);
});
