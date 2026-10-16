import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { fetchWeatherData, weatherCacheKey, readWeatherCache } from './weather';
import { useWeather } from '../hooks/useWeather';

const rawWeather = temp => ({ current: { temperature_2m: temp, apparent_temperature: temp - 1, relative_humidity_2m: 50, wind_speed_10m: 5, weather_code: 85 },
    daily: { time: ['2026-10-16', '2026-10-17'], sunrise: ['2026-10-16T06:12'], sunset: ['2026-10-16T18:09'], temperature_2m_max: [20, 21], temperature_2m_min: [10, 11], weather_code: [85, 86] } });
const response = data => ({ ok: true, json: async () => data });
beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: success => success({ coords: { latitude: 0, longitude: 0 } }) } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(rawWeather(20))));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

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
