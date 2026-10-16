import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { createSettingsBackup, parseSettingsBackup, restoreSettingsBackup, resetAuraData } from './settingsBackup';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DEFAULT_SETTINGS } from '../stores/settingsSchema';
import { deleteBackgroundBlob } from './db';

vi.mock('./db', () => ({ deleteBackgroundBlob: vi.fn().mockResolvedValue() }));
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); useSettingsStore.setState(structuredClone(DEFAULT_SETTINGS)); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('real settings persistence and backups', () => {
    it('sanitizes same-version hydration without accepting action names or invalid arrays', async () => {
        localStorage.setItem('dash_settings', JSON.stringify({ version: 1, state: { lofiStations: null, customEngines: {}, speedDials: [null], setUsername: 'broken', volume: 12 } }));
        await useSettingsStore.persist.rehydrate();
        const state = useSettingsStore.getState();
        expect(state.lofiStations).toEqual(DEFAULT_SETTINGS.lofiStations);
        expect(state.customEngines).toEqual([]);
        expect(state.speedDials).toEqual([]);
        expect(state.volume).toBe(0.2);
        expect(typeof state.setUsername).toBe('function');
    });

    it('exports and restores data without actions, caches or media blobs', async () => {
        useSettingsStore.getState().setVolume(0);
        useSettingsStore.getState().setUsername('Restored user');
        const backup = createSettingsBackup(useSettingsStore.getState());
        expect(backup).not.toContain('setUsername');
        expect(backup).not.toContain('backgroundUrl');
        useSettingsStore.getState().setUsername('Changed user');
        restoreSettingsBackup(backup);
        await useSettingsStore.persist.rehydrate();
        expect(useSettingsStore.getState().username).toBe('Restored user');
        expect(useSettingsStore.getState().volume).toBe(0);
    });

    it.each([
        { lofiStations: null }, { customEngines: {} }, { speedDials: [null] }, { volume: -1 },
        { setUsername: 'overwritten' }, { theme: {} },
        { speedDials: [{ id: 1, name: 'Unsafe', url: 'javascript:alert(1)' }] },
    ])('rejects malformed backup atomically: %j', state => {
        const previous = localStorage.getItem('dash_settings');
        expect(() => restoreSettingsBackup(JSON.stringify({ dash_settings: JSON.stringify({ version: 1, state }) }))).toThrow();
        expect(localStorage.getItem('dash_settings')).toBe(previous);
    });

    it('preserves the previous settings on a quota failure', () => {
        const previous = localStorage.getItem('dash_settings');
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
        expect(() => restoreSettingsBackup(createSettingsBackup({ username: 'New' }))).toThrow('Full');
        expect(localStorage.getItem('dash_settings')).toBe(previous);
        expect(() => useSettingsStore.getState().setUsername('In memory')).not.toThrow();
        expect(useSettingsStore.getState().username).toBe('In memory');
    });

    it('migrates a zero-volume legacy backup and rejects unknown/future formats', () => {
        expect(parseSettingsBackup(JSON.stringify({ dash_volume: '0', dash_username: 'Legacy' }))).toMatchObject({ volume: 0, username: 'Legacy' });
        expect(() => parseSettingsBackup('{"unrelated":"value"}')).toThrow();
        expect(() => parseSettingsBackup('{"format":"aura-settings","version":99,"settings":{}}')).toThrow();
    });

    it('only resets Aura storage, clears user profile fields, and never touches unrelated caches or registrations', async () => {
        useSettingsStore.getState().setUsername('Alice');
        useSettingsStore.getState().setMalUsername('alice_mal');
        localStorage.setItem('another-app', 'keep'); sessionStorage.setItem('another-session', 'keep');
        sessionStorage.setItem('dash_session', 'erase');
        const caches = { keys: vi.fn(), delete: vi.fn() };
        vi.stubGlobal('caches', caches);
        await resetAuraData();
        expect(deleteBackgroundBlob).toHaveBeenCalled();
        expect(useSettingsStore.getState().username).toBe('');
        expect(useSettingsStore.getState().malUsername).toBe('');
        expect(localStorage.getItem('dash_settings')).toBeNull();
        expect(localStorage.getItem('another-app')).toBe('keep');
        expect(sessionStorage.getItem('another-session')).toBe('keep');
        expect(sessionStorage.getItem('dash_session')).toBeNull();
        expect(caches.keys).not.toHaveBeenCalled();
    });

    it('preserves settings if background deletion fails', async () => {
        deleteBackgroundBlob.mockRejectedValueOnce(new Error('Disk failure'));
        const previous = localStorage.getItem('dash_settings');
        await expect(resetAuraData()).rejects.toThrow('Disk failure');
        expect(localStorage.getItem('dash_settings')).toBe(previous);
    });

    it('boots with defaults when browser storage is denied', async () => {
        vi.resetModules();
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError'); });
        const { useSettingsStore: isolatedStore } = await import('../stores/useSettingsStore');
        expect(isolatedStore.getState().lofiStations.length).toBeGreaterThan(0);
        expect(() => isolatedStore.getState().setUsername('Guest')).not.toThrow();
    });
});
