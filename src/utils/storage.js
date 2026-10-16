/**
 * Safely parse a JSON string with a fallback value if parsing fails.
 * Protects against malformed data and corrupted localStorage items.
 *
 * @param {string|null|undefined} raw
 * @param {*} fallback
 * @returns {*}
 */
export function safeJsonParse(raw, fallback = null) {
    if (raw === null || raw === undefined || typeof raw !== 'string') {
        return fallback;
    }
    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

/**
 * Safely stringify a value to JSON, catching circular references or serialization errors.
 *
 * @param {*} value
 * @param {string} fallback
 * @returns {string}
 */
export function safeJsonStringify(value, fallback = '{}') {
    try {
        return JSON.stringify(value);
    } catch {
        return fallback;
    }
}

// Resolve storage on each call: browsers can deny access even to the property.
const memory = new Map();
const pending = new Set();
export const safeStorage = {
    getItem(key) {
        if (pending.has(key)) return memory.get(key) ?? null;
        try { return globalThis.localStorage.getItem(key); }
        catch { return memory.get(key) ?? null; }
    },
    setItem(key, value) {
        memory.set(key, String(value));
        try { globalThis.localStorage.setItem(key, String(value)); pending.delete(key); return true; }
        catch { pending.add(key); return false; }
    },
    removeItem(key) {
        memory.delete(key);
        pending.delete(key);
        try { globalThis.localStorage.removeItem(key); return true; }
        catch { return false; }
    },
    clearPrefix(prefix = 'dash_') {
        for (const key of [...memory.keys()]) {
            if (key?.startsWith(prefix)) {
                memory.delete(key);
                pending.delete(key);
            }
        }
    },
};
