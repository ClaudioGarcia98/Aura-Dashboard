import { useSettingsStore } from '../stores/useSettingsStore';
import { sanitizeSettings } from '../stores/settingsSchema';
import { saveBackgroundBlob, deleteBackgroundBlob } from './db';
import { DEFAULT_BACKGROUND } from '../constants/background';
import { safeStorage } from '../utils/storage';

export const MAX_WALLPAPER_BYTES = 50 * 1024 * 1024;
export const BACKGROUND_MEDIA_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']);
export const BACKGROUND_ACCEPT = [...BACKGROUND_MEDIA_TYPES].join(',');
export const MEDIA_DECODE_TIMEOUT_MS = 10000;
export const BACKGROUND_RECOVERY_MESSAGE = 'Your saved background could not play. The default background has been restored.';
export class BackgroundMediaError extends Error {}

const abortError = () => new DOMException('Background change cancelled', 'AbortError');
let validationController;
let writes = Promise.resolve();

// Browser decoding catches both damaged files and otherwise valid video files
// whose codec is unavailable on this device. MIME labels alone cannot do that.
export function validateBackgroundMedia(blob, { signal, timeoutMs = MEDIA_DECODE_TIMEOUT_MS } = {}) {
    if (signal?.aborted) return Promise.reject(abortError());
    if (!blob || !BACKGROUND_MEDIA_TYPES.has(blob.type)) return Promise.reject(new BackgroundMediaError('Choose a PNG, JPEG, WebP, GIF, MP4, or WebM background.'));
    if (!blob.size) return Promise.reject(new BackgroundMediaError('This background file is empty.'));
    if (blob.size > MAX_WALLPAPER_BYTES) return Promise.reject(new BackgroundMediaError('File exceeds 50MB maximum limit'));
    return new Promise((resolve, reject) => {
        const isVideo = blob.type.startsWith('video/');
        const media = isVideo ? document.createElement('video') : new Image();
        const url = URL.createObjectURL(blob);
        let settled = false;
        const finish = error => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            signal?.removeEventListener('abort', onAbort);
            media.onload = media.onerror = media.onloadeddata = null;
            if (isVideo) { media.removeAttribute('src'); try { media.load(); } catch { /* Release the URL even if the media element has failed. */ } }
            else media.src = '';
            URL.revokeObjectURL(url);
            if (error) reject(error);
            else resolve({ isVideo });
        };
        const invalid = () => finish(new BackgroundMediaError('This image or video could not be played. Choose another background.'));
        const onAbort = () => finish(abortError());
        const timer = setTimeout(() => finish(new BackgroundMediaError('Background validation timed out. Try another file.')), timeoutMs);
        signal?.addEventListener('abort', onAbort, { once: true });
        media.onerror = invalid;
        if (isVideo) {
            media.muted = true;
            media.preload = 'auto';
            media.playsInline = true;
            media.onloadeddata = () => {
                if (media.videoWidth > 0 && media.videoHeight > 0 && Number.isFinite(media.duration) && media.duration > 0) finish();
                else invalid();
            };
        } else {
            media.onload = () => media.naturalWidth > 0 && media.naturalHeight > 0 ? finish() : invalid();
        }
        try {
            media.src = url;
            if (isVideo) media.load();
        } catch { invalid(); }
    });
}

function enqueueWrite(callback) {
    const result = writes.then(callback);
    writes = result.catch(() => {});
    return result;
}

// All background writers share one queue: a slow older IndexedDB request cannot
// finish after a newer upload or restore and replace its saved wallpaper.
export async function changeBackground({ blob = null, name = '', settings = {}, persistSettings = false } = {}) {
    validationController?.abort();
    const controller = new AbortController();
    validationController = controller;
    if (blob) await validateBackgroundMedia(blob, { signal: controller.signal });
    return enqueueWrite(async () => {
        if (controller.signal.aborted) throw abortError();
        const previousState = useSettingsStore.getState();
        const updates = { ...settings, gifName: blob ? name : '',
            backgroundUrl: blob ? URL.createObjectURL(blob) : DEFAULT_BACKGROUND.url,
            backgroundIsVideo: !blob || blob.type.startsWith('video/') };
        let previousSettings;
        let wroteSettings = false;
        try {
            if (persistSettings) {
                previousSettings = safeStorage.getItem('dash_settings');
                safeStorage.setItemStrict('dash_settings', JSON.stringify({ state: sanitizeSettings({ ...previousState, ...updates }), version: 1 }));
                wroteSettings = true;
            }
            if (blob) await saveBackgroundBlob(blob);
            else await deleteBackgroundBlob();
        } catch (error) {
            if (blob) URL.revokeObjectURL(updates.backgroundUrl);
            if (wroteSettings) {
                const current = useSettingsStore.getState();
                // Preserve changes made elsewhere while the database was busy.
                if (current !== previousState) safeStorage.setItemStrict('dash_settings', JSON.stringify({ state: sanitizeSettings(current), version: 1 }));
                else if (previousSettings === null) safeStorage.removeItem('dash_settings');
                else safeStorage.setItemStrict('dash_settings', previousSettings);
            }
            throw error;
        }
        useSettingsStore.setState(updates);
        return true;
    });
}

// Recovery must work even when IndexedDB is unavailable. Switch the visible
// background immediately; deletion is best effort and shares the writer queue.
export function recoverBackground(failedUrl) {
    const state = useSettingsStore.getState();
    if (state.backgroundUrl !== failedUrl) return false;
    const defaultFailed = failedUrl === DEFAULT_BACKGROUND.url;
    useSettingsStore.setState({ backgroundUrl: defaultFailed ? null : DEFAULT_BACKGROUND.url,
        backgroundIsVideo: !defaultFailed, gifName: '' });
    if (!defaultFailed) {
        void enqueueWrite(async () => {
            if (useSettingsStore.getState().backgroundUrl === DEFAULT_BACKGROUND.url) await deleteBackgroundBlob();
        }).catch(() => {});
    }
    return true;
}
