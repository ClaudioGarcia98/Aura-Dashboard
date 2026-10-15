const DB_NAME = 'dashDB';
const DB_VERSION = 1;
const STORE_NAME = 's';
const BG_KEY = 'bg';

function openDatabase() {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            return reject(new Error('IndexedDB is not supported'));
        }
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

export async function getBackgroundBlob() {
    try {
        const db = await openDatabase();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(BG_KEY);
            req.onsuccess = (e) => {
                db.close?.();
                resolve(e.target.result || null);
            };
            req.onerror = (e) => {
                db.close?.();
                reject(e.target.error);
            };
        });
    } catch {
        return null;
    }
}

export async function saveBackgroundBlob(blob) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(blob, BG_KEY);
        tx.oncomplete = () => {
            db.close?.();
            resolve();
        };
        tx.onerror = (e) => {
            db.close?.();
            reject(e.target.error);
        };
    });
}

export async function deleteBackgroundBlob() {
    try {
        const db = await openDatabase();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete(BG_KEY);
            tx.oncomplete = () => {
                db.close?.();
                resolve();
            };
            tx.onerror = (e) => {
                db.close?.();
                reject(e.target.error);
            };
        });
    } catch {
        // Silently ignore if already missing
    }
}
