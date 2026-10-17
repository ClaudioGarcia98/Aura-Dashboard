import { DEFAULT_SETTINGS, LEGACY_KEYS, readLegacySettings, sanitizeSettings } from '../stores/settingsSchema';
import { useSettingsStore } from '../stores/useSettingsStore';
import { safeStorage } from '../utils/storage';
import { clearMalMemoryCache } from './anime/watching';
import { deleteBackgroundBlob } from './db';
import { initialFocusState, useFocusStore } from '../stores/useFocusStore';

export function createSettingsBackup(state) {
    return JSON.stringify({ format: 'aura-settings', version: 1, settings: sanitizeSettings(state) }, null, 2);
}

export function parseSettingsBackup(raw) {
    if (typeof raw !== 'string' || raw.length > 1024 * 1024) throw new Error('Backup exceeds the 1 MB limit.');
    const backup = JSON.parse(raw);
    if (!backup || typeof backup !== 'object' || Array.isArray(backup)) throw new Error('Invalid backup format.');
    let settings;
    if (backup.format === 'aura-settings' && backup.version === 1) {
        settings = sanitizeSettings(backup.settings, { strict: true });
    } else if (typeof backup.dash_settings === 'string') {
        const persisted = JSON.parse(backup.dash_settings);
        if (![0, 1].includes(persisted?.version ?? 0)) throw new Error('Unsupported settings version.');
        settings = sanitizeSettings(persisted.state, { strict: true });
    } else {
        const known = Object.values(LEGACY_KEYS).filter(key => Object.hasOwn(backup, key));
        if (!known.length) throw new Error('Invalid backup format.');
        if (known.some(key => typeof backup[key] !== 'string')) throw new Error('Invalid legacy settings.');
        const legacyStorage = { getItem: key => backup[key] ?? null };
        settings = readLegacySettings(legacyStorage);
        // Validate every supplied legacy value, rather than silently accepting a broken backup.
        for (const [key, legacyKey] of Object.entries(LEGACY_KEYS)) {
            if (!known.includes(legacyKey)) continue;
            const value = typeof DEFAULT_SETTINGS[key] === 'string' ? backup[legacyKey] : JSON.parse(backup[legacyKey]);
            sanitizeSettings({ [key]: value }, { strict: true });
        }
    }
    return { ...DEFAULT_SETTINGS, ...settings };
}

export function restoreSettingsBackup(raw) {
    const settings = parseSettingsBackup(raw);
    // A single atomic storage write: validation/quota failure preserves the previous backup.
    globalThis.localStorage.setItem('dash_settings', JSON.stringify({ state: settings, version: 1 }));
    return settings;
}

export async function resetAuraData() {
    // Do not erase settings if deleting the saved background failed.
    await deleteBackgroundBlob();
    clearMalMemoryCache();
    useFocusStore.setState(initialFocusState());
    useSettingsStore.setState({
        ...structuredClone(DEFAULT_SETTINGS),
        backgroundUrl: null,
        backgroundIsVideo: false,
        malStatus: 'idle',
        malSavedAt: null,
        malError: false,
        malLoading: false,
        malSuccess: false,
    });
    for (const storage of [globalThis.localStorage, globalThis.sessionStorage]) {
        if (!storage) continue;
        const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i));
        for (const key of keys) if (key?.startsWith('dash_')) storage.removeItem(key);
    }
    safeStorage.clearPrefix('dash_');
}
