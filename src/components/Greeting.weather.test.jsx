import { render, screen, act } from '@testing-library/react';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import Greeting from './Greeting';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DEFAULT_SETTINGS } from '../stores/settingsSchema';
import { useWeatherStore } from '../stores/useWeatherStore';
import { weatherCacheKey, WEATHER_REFRESH_MS } from '../services/weather';
import { translate } from '../i18n/core';

function weather(patch = {}) {
    return { key: weatherCacheKey(true, 'London'), weatherCode: 61, iconType: 'rain', temp: '18°C', feelsLike: '17°C',
        humidity: '65%', wind: '5 km/h', sunrise: '07:00', sunset: '18:00', forecast: [], timestamp: Date.now(), ...patch };
}
beforeEach(() => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-19T10:00:00Z'));
    localStorage.clear();
    useWeatherStore.setState({ snapshot: null });
    useSettingsStore.setState({ ...structuredClone(DEFAULT_SETTINGS), language: 'en', timeZone: 'UTC', fallbackCity: 'London' });
});
afterEach(() => vi.useRealTimers());

it.each([
    { timestamp: Date.parse('2026-10-12T10:00:00Z') }, { timestamp: Date.parse('2026-10-20T10:00:00Z') },
    { key: weatherCacheKey(true, 'Paris') }, { humidity: 'invalid' }, { weatherCode: 46 },
])('does not use invalid or mismatched saved weather: %j', patch => {
    localStorage.setItem('dash_weather_cache', JSON.stringify(weather(patch)));
    render(<Greeting />);
    expect(screen.getByText('Good morning')).toBeTruthy();
});

it('uses valid current weather and clears it after freshness expires', () => {
    localStorage.setItem('dash_weather_cache', JSON.stringify(weather()));
    render(<Greeting />);
    expect(screen.getByText('Cozy rainy morning')).toBeTruthy();
    act(() => vi.advanceTimersByTime(WEATHER_REFRESH_MS + 60000));
    expect(screen.getByText('Good morning')).toBeTruthy();
});

it('clears conditions on offline location changes, hiding weather, and failed refresh, then recovers', () => {
    const data = weather();
    useWeatherStore.setState({ snapshot: { key: data.key, data, stale: false } });
    render(<Greeting />);
    expect(screen.getByText('Cozy rainy morning')).toBeTruthy();
    act(() => useSettingsStore.getState().setFallbackCity('Paris'));
    expect(screen.getByText('Good morning')).toBeTruthy();
    act(() => useSettingsStore.getState().setFallbackCity('London'));
    expect(screen.getByText('Cozy rainy morning')).toBeTruthy();
    act(() => useWeatherStore.setState({ snapshot: { key: data.key, data, stale: true } }));
    expect(screen.getByText('Good morning')).toBeTruthy();
    act(() => useWeatherStore.setState({ snapshot: { key: data.key, data, stale: false } }));
    expect(screen.getByText('Cozy rainy morning')).toBeTruthy();
    act(() => useSettingsStore.getState().setShowWeatherWidget(false));
    expect(screen.getByText('Good morning')).toBeTruthy();
});

it.each([['fr', 1, 'Mainly clear'], ['de', 66, 'Freezing rain'], ['ja', 56, 'Freezing drizzle']])('shares condition mapping for %s code %s', (locale, code, label) => {
    const data = weather({ weatherCode: code });
    useSettingsStore.setState({ language: locale });
    useWeatherStore.setState({ snapshot: { key: data.key, data, stale: false } });
    render(<Greeting />);
    expect(screen.getByText(`${translate(locale, 'Good morning')} · ${translate(locale, label)}`)).toBeTruthy();
});
