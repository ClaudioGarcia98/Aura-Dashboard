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
