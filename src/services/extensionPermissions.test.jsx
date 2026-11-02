import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { hasExtensionPermission, isExtensionPage, ONLINE_DATA_PERMISSIONS, requestExtensionDataPermissions, requestExtensionGeolocation, removeExtensionGeolocation } from './extensionPermissions';
import { fetchJson } from './http';
import { resolveLocation } from './weather';
import { useExtensionPermission } from '../hooks/useExtensionPermission';
import PrivacySettings from '../components/SettingsPanel/PrivacySettings';
import SearchBox from '../components/SearchBox';
import SpeedDial from '../components/SpeedDial';
import { useSettingsStore } from '../stores/useSettingsStore';

function firefox(granted = []) {
    let data = [...granted];
    let geolocation = false;
    const added = new Set(), removed = new Set();
    const event = listeners => ({ addListener: fn => listeners.add(fn), removeListener: fn => listeners.delete(fn) });
    const api = {
        runtime: { id: 'aura-test@example.org', getManifest: () => ({ browser_specific_settings: { gecko: {
            data_collection_permissions: { required: ['none'], optional: ONLINE_DATA_PERMISSIONS },
        } } }) },
        permissions: {
            getAll: vi.fn(async () => ({ data_collection: data })),
            contains: vi.fn(async () => geolocation),
            request: vi.fn(async permission => {
                data = [...new Set([...data, ...permission.data_collection || []])];
                geolocation ||= permission.permissions?.includes('geolocation') === true;
                added.forEach(fn => fn(permission));
                return true;
            }),
            remove: vi.fn(async () => { geolocation = false; removed.forEach(fn => fn({ permissions: ['geolocation'] })); return true; }),
            onAdded: event(added), onRemoved: event(removed),
        },
        revoke: type => { data = data.filter(value => value !== type); removed.forEach(fn => fn({ data_collection: [type] })); },
    };
    vi.stubGlobal('browser', api);
    return api;
}

beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({ language: 'en', remoteSuggestions: false, pauseBackground: false, speedDials: [], customEngines: [] });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('leaves the website unaffected without an extension runtime', async () => {
    expect(isExtensionPage()).toBe(false);
    expect(await hasExtensionPermission('locationInfo')).toBe(true);
    expect(await hasExtensionPermission('geolocation')).toBe(true);
    await fetchJson('https://api.open-meteo.com/v1/forecast');
    expect(fetch).toHaveBeenCalledTimes(1);
});

it.each([
    ['https://api.open-meteo.com/v1/forecast?latitude=1&longitude=2', 'locationInfo'],
    ['https://geocoding-api.open-meteo.com/v1/search?name=London', 'locationInfo'],
    ['https://ipapi.co/json/', 'locationInfo'],
    ['https://aura-mal-api.claudio091998.workers.dev/animelist/alice/load.json', 'authenticationInfo'],
    ['https://suggestqueries.google.com/complete/search?q=private', 'searchTerms'],
])('gates %s before sending personal data and allows it only after consent', async (url, permission) => {
    const api = firefox();
    await expect(fetchJson(url)).rejects.toMatchObject({ code: 'EXTENSION_PERMISSION_REQUIRED' });
    expect(fetch).not.toHaveBeenCalled();
    await requestExtensionDataPermissions([permission]);
    expect(api.permissions.request).toHaveBeenCalledWith({ data_collection: [permission] });
    await fetchJson(url);
    expect(fetch).toHaveBeenCalledTimes(1);
    api.revoke(permission);
    await expect(fetchJson(url)).rejects.toMatchObject({ code: 'EXTENSION_PERMISSION_REQUIRED' });
    expect(fetch).toHaveBeenCalledTimes(1);
});

it('fails closed when Firefox cannot read its data permissions', async () => {
    const api = firefox();
    api.permissions.getAll.mockRejectedValue(new Error('Permission API unavailable'));
    expect(await hasExtensionPermission('searchTerms')).toBe(false);
    await expect(fetchJson('https://suggestqueries.google.com/complete/search?q=test')).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
});

it('does not call GPS or IP lookup before Firefox location consent', async () => {
    firefox();
    const gps = vi.fn();
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: gps } });
    await expect(resolveLocation('', new AbortController().signal)).rejects.toMatchObject({ code: 'EXTENSION_PERMISSION_REQUIRED' });
    expect(gps).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
});

it('uses a selected city without requesting device location and invalidates saved GPS coordinates on removal', async () => {
    const api = firefox(['locationInfo']);
    const gps = vi.fn();
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: gps } });
    const result = await resolveLocation('Paris', new AbortController().signal, { city: 'Paris', lat: 48.85, lon: 2.35 });
    expect(result).toMatchObject({ lat: 48.85, lon: 2.35, source: 'city' });
    expect(gps).not.toHaveBeenCalled();
    expect(api.permissions.request).not.toHaveBeenCalled();
    localStorage.setItem('dash_geo', JSON.stringify({ source: 'gps' }));
    const pending = requestExtensionGeolocation();
    expect(api.permissions.request).toHaveBeenCalledWith({ permissions: ['geolocation'], data_collection: ['locationInfo'] });
    expect(await pending).toBe(true);
    expect(localStorage.getItem('dash_geo')).toBeNull();
    expect(await hasExtensionPermission('geolocation')).toBe(true);
    await removeExtensionGeolocation();
    expect(await hasExtensionPermission('geolocation')).toBe(false);
});

it('keeps declined permissions disabled and updates mounted UI when Firefox revokes consent', async () => {
    const api = firefox();
    const { result } = renderHook(() => useExtensionPermission('searchTerms'));
    expect(result.current).toBe(false);
    api.permissions.request.mockResolvedValueOnce(false);
    await act(async () => { expect(await requestExtensionDataPermissions(['searchTerms'])).toBe(false); });
    expect(result.current).toBe(false);
    await act(async () => { await requestExtensionDataPermissions(['searchTerms']); });
    expect(result.current).toBe(true);
    await act(async () => { api.revoke('searchTerms'); });
    expect(result.current).toBe(false);
});

it('explains optional transmissions and requests consent directly from the Privacy Settings button', async () => {
    const api = firefox();
    render(<PrivacySettings />);
    fireEvent.click(screen.getByRole('button', { name: 'Enable online features' }));
    expect(api.permissions.request).toHaveBeenCalledWith({ data_collection: ONLINE_DATA_PERMISSIONS });
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Online features enabled.'));
});

it('keeps custom favicon domains local until consent and removes icons after revocation', async () => {
    const api = firefox();
    useSettingsStore.setState({ speedDials: [{ id: 'private', name: 'Private website', url: 'https://private.example' }] });
    render(<SpeedDial />);
    expect(screen.queryByRole('img')).toBeNull();
    await act(async () => { await requestExtensionDataPermissions(['browsingActivity']); });
    expect(screen.getByRole('img').getAttribute('src')).toContain('private.example');
    await act(async () => { api.revoke('browsingActivity'); });
    expect(screen.queryByRole('img')).toBeNull();
});

it('requires search consent before opening a provider and keeps normal new-tab focus', async () => {
    firefox();
    const open = vi.spyOn(window, 'open').mockImplementation(() => {});
    render(<SearchBox />);
    const input = screen.getByRole('combobox');
    expect(document.activeElement).not.toBe(input);
    fireEvent.change(input, { target: { value: 'private search' } });
    fireEvent.submit(input.closest('form'));
    expect(open).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Enable searches' })); });
    fireEvent.submit(input.closest('form'));
    expect(open).toHaveBeenCalledWith('https://www.google.com/search?q=private%20search', '_blank', 'noopener,noreferrer');
});
