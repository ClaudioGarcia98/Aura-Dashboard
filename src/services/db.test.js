import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getBackgroundBlob, saveBackgroundBlob, deleteBackgroundBlob } from './db';

function createMockIndexedDB({
    openError = false,
    getError = false,
    putError = false,
    deleteError = false,
    initialData = null,
} = {}) {
    let storedData = initialData;

    const objectStoreNames = {
        contains: vi.fn(() => true),
    };

    const objectStore = {
        get: vi.fn((key) => {
            const req = { onsuccess: null, onerror: null };
            Promise.resolve().then(() => {
                if (getError) {
                    req.onerror?.({ target: { error: new Error('Get failed') } });
                } else {
                    req.onsuccess?.({ target: { result: key === 'bg' ? storedData : null } });
                }
            });
            return req;
        }),
        put: vi.fn((val, key) => {
            if (key === 'bg') storedData = val;
        }),
        delete: vi.fn((key) => {
            if (key === 'bg') storedData = null;
        }),
    };

    const transaction = {
        objectStore: vi.fn(() => objectStore),
        oncomplete: null,
        onerror: null,
    };

    const db = {
        objectStoreNames,
        createObjectStore: vi.fn(),
        transaction: vi.fn(() => {
            Promise.resolve().then(() => {
                if (putError || deleteError) {
                    transaction.onerror?.({ target: { error: new Error('Tx failed') } });
                } else {
                    transaction.oncomplete?.();
                }
            });
            return transaction;
        }),
    };

    const openRequest = {
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
    };

    const open = vi.fn(() => {
        Promise.resolve().then(() => {
            if (openError) {
                openRequest.onerror?.({ target: { error: new Error('Open failed') } });
            } else {
                openRequest.onsuccess?.({ target: { result: db } });
            }
        });
        return openRequest;
    });

    return { open, db, objectStore, transaction };
}

describe('db service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        delete globalThis.indexedDB;
    });

    describe('getBackgroundBlob', () => {
        it('returns blob from indexedDB when present', async () => {
            const mockBlob = new Blob(['sample'], { type: 'image/png' });
            const mockIdb = createMockIndexedDB({ initialData: mockBlob });
            globalThis.indexedDB = { open: mockIdb.open };

            const result = await getBackgroundBlob();
            expect(result).toBe(mockBlob);
            expect(mockIdb.open).toHaveBeenCalledWith('dashDB', 1);
        });

        it('returns null when no blob is found', async () => {
            const mockIdb = createMockIndexedDB({ initialData: null });
            globalThis.indexedDB = { open: mockIdb.open };

            const result = await getBackgroundBlob();
            expect(result).toBeNull();
        });

        it('returns null when opening database fails', async () => {
            const mockIdb = createMockIndexedDB({ openError: true });
            globalThis.indexedDB = { open: mockIdb.open };

            const result = await getBackgroundBlob();
            expect(result).toBeNull();
        });

        it('returns null when get operation fails', async () => {
            const mockIdb = createMockIndexedDB({ getError: true });
            globalThis.indexedDB = { open: mockIdb.open };

            const result = await getBackgroundBlob();
            expect(result).toBeNull();
        });

        it('returns null when indexedDB is undefined', async () => {
            delete globalThis.indexedDB;
            const result = await getBackgroundBlob();
            expect(result).toBeNull();
        });
    });

    describe('saveBackgroundBlob', () => {
        it('saves blob successfully', async () => {
            const mockBlob = new Blob(['video-content'], { type: 'video/mp4' });
            const mockIdb = createMockIndexedDB();
            globalThis.indexedDB = { open: mockIdb.open };

            await expect(saveBackgroundBlob(mockBlob)).resolves.toBeUndefined();
            expect(mockIdb.objectStore.put).toHaveBeenCalledWith(mockBlob, 'bg');
        });

        it('rejects when transaction fails', async () => {
            const mockBlob = new Blob(['data'], { type: 'image/jpeg' });
            const mockIdb = createMockIndexedDB({ putError: true });
            globalThis.indexedDB = { open: mockIdb.open };

            await expect(saveBackgroundBlob(mockBlob)).rejects.toThrow('Tx failed');
        });

        it('rejects when indexedDB is undefined', async () => {
            delete globalThis.indexedDB;
            await expect(saveBackgroundBlob(new Blob(['test']))).rejects.toThrow('IndexedDB is not supported');
        });
    });

    describe('deleteBackgroundBlob', () => {
        it('deletes background blob successfully', async () => {
            const mockIdb = createMockIndexedDB();
            globalThis.indexedDB = { open: mockIdb.open };

            await expect(deleteBackgroundBlob()).resolves.toBeUndefined();
            expect(mockIdb.objectStore.delete).toHaveBeenCalledWith('bg');
        });

        it('handles database error gracefully without throwing', async () => {
            const mockIdb = createMockIndexedDB({ deleteError: true });
            globalThis.indexedDB = { open: mockIdb.open };

            await expect(deleteBackgroundBlob()).resolves.toBeUndefined();
        });

        it('handles undefined indexedDB gracefully without throwing', async () => {
            delete globalThis.indexedDB;
            await expect(deleteBackgroundBlob()).resolves.toBeUndefined();
        });
    });
});
