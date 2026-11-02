import { safeStorage } from '../utils/storage';

export const BACKGROUND_REVISION_KEY = 'dash_background_revision';

// Blob URLs belong to the tab that created them. Notify peers only after the
// database commit so they can read the blob and create their own local URL.
export function notifyBackgroundChanged() {
    // Keep successful uploads successful even on HTTP previews without UUIDs.
    const revision = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    safeStorage.setItem(BACKGROUND_REVISION_KEY, revision);
}
