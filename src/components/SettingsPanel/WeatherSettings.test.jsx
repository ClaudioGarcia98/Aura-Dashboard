import { render, screen, fireEvent, act } from '@testing-library/react';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import WeatherSettings from './WeatherSettings';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { createSettingsBackup, parseSettingsBackup } from '../../services/settingsBackup';

beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    useSettingsStore.setState({ language: 'en', fallbackCity: '', fallbackCityLocation: null, useCelsius: true });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [
        { name: 'Springfield', admin1: 'Oregon', country: 'United States', latitude: 44.0462, longitude: -123.022 },
    ] }) }));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('saves the exact selected city coordinates through reload and backup and clears them with the city', async () => {
    render(<WeatherSettings active />);
    fireEvent.change(screen.getByLabelText(/Your City/), { target: { value: 'Springfield' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    fireEvent.click(screen.getByText('Springfield'));
    const city = 'Springfield, Oregon, United States';
    const location = { city, lat: 44.0462, lon: -123.022 };
    expect(useSettingsStore.getState()).toMatchObject({ fallbackCity: city, fallbackCityLocation: location });
    await act(async () => { await useSettingsStore.persist.rehydrate(); });
    expect(useSettingsStore.getState().fallbackCityLocation).toEqual(location);
    expect(parseSettingsBackup(createSettingsBackup(useSettingsStore.getState())).fallbackCityLocation).toEqual(location);
    fireEvent.change(screen.getByLabelText(/Your City/), { target: { value: '' } });
    expect(useSettingsStore.getState()).toMatchObject({ fallbackCity: '', fallbackCityLocation: null });
});

it('does not save a city search that has not been selected', async () => {
    render(<WeatherSettings active />);
    fireEvent.change(screen.getByLabelText(/Your City/), { target: { value: 'Springfield' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(useSettingsStore.getState()).toMatchObject({ fallbackCity: '', fallbackCityLocation: null });
});
