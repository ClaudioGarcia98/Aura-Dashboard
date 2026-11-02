// Only extension pages have a runtime ID. The ordinary website never requests
// extension permissions and keeps its existing browser permission behavior.
export const ONLINE_DATA_PERMISSIONS = ['locationInfo', 'authenticationInfo', 'searchTerms', 'browsingActivity'];
export const EXTENSION_PERMISSIONS_CHANGED = 'aura-extension-permissions-changed';

function extensionApi() {
    if (globalThis.browser?.runtime?.id) return globalThis.browser;
    if (globalThis.chrome?.runtime?.id) return globalThis.chrome;
    return null;
}

export function isExtensionPage() { return !!extensionApi(); }

export function usesFirefoxDataConsent() {
    return !!extensionApi()?.runtime?.getManifest?.()?.browser_specific_settings?.gecko?.data_collection_permissions;
}

function changed() {
    globalThis.window?.dispatchEvent(new Event(EXTENSION_PERMISSIONS_CHANGED));
}

export async function hasExtensionPermission(type) {
    const api = extensionApi();
    if (!api || (type !== 'geolocation' && !usesFirefoxDataConsent())) return true;
    try {
        if (type === 'geolocation') return !!await api.permissions.contains({ permissions: ['geolocation'] });
        const declared = api.runtime.getManifest().browser_specific_settings.gecko.data_collection_permissions;
        if (declared.required?.includes(type)) return true;
        const granted = await api.permissions.getAll();
        return granted.data_collection?.includes(type) === true;
    } catch { return false; }
}

// Call directly in a user event: waiting before permissions.request can lose
// Firefox's user activation. A rejection/decline must keep the feature disabled.
export function requestExtensionDataPermissions(types = ONLINE_DATA_PERMISSIONS) {
    if (!usesFirefoxDataConsent()) return Promise.resolve(true);
    try {
        return Promise.resolve(extensionApi().permissions.request({ data_collection: types }))
            .then(granted => { changed(); return !!granted; }, () => false);
    } catch { return Promise.resolve(false); }
}

export function requestExtensionGeolocation() {
    const api = extensionApi();
    if (!api) return Promise.resolve(true);
    const permissions = { permissions: ['geolocation'] };
    if (usesFirefoxDataConsent()) permissions.data_collection = ['locationInfo'];
    try {
        return Promise.resolve(api.permissions.request(permissions)).then(granted => {
            if (granted) { globalThis.localStorage?.removeItem('dash_geo'); changed(); }
            return !!granted;
        }, () => false);
    } catch { return Promise.resolve(false); }
}

export async function removeExtensionGeolocation() {
    try {
        const removed = await extensionApi()?.permissions.remove({ permissions: ['geolocation'] });
        if (removed) { globalThis.localStorage?.removeItem('dash_geo'); changed(); }
        return !!removed;
    } catch { return false; }
}

export function subscribeExtensionPermissions(listener) {
    const api = extensionApi();
    api?.permissions?.onAdded?.addListener(listener);
    api?.permissions?.onRemoved?.addListener(listener);
    globalThis.window?.addEventListener(EXTENSION_PERMISSIONS_CHANGED, listener);
    return () => {
        api?.permissions?.onAdded?.removeListener(listener);
        api?.permissions?.onRemoved?.removeListener(listener);
        globalThis.window?.removeEventListener(EXTENSION_PERMISSIONS_CHANGED, listener);
    };
}

export async function requireExtensionPermission(type) {
    if (await hasExtensionPermission(type)) return;
    const error = new Error('Enable online features in Settings → Privacy & Motion.');
    error.code = 'EXTENSION_PERMISSION_REQUIRED';
    throw error;
}

export async function checkExtensionRequestPermission(url) {
    if (!usesFirefoxDataConsent()) return;
    const hostname = new URL(url, globalThis.location?.href).hostname;
    if (['api.open-meteo.com', 'geocoding-api.open-meteo.com', 'ipapi.co'].includes(hostname)) {
        await requireExtensionPermission('locationInfo');
    } else if (hostname === 'aura-mal-api.claudio091998.workers.dev') {
        await requireExtensionPermission('authenticationInfo');
    } else if (hostname === 'suggestqueries.google.com') {
        await requireExtensionPermission('searchTerms');
    }
}
