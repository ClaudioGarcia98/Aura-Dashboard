export function httpUrl(value) {
    if (typeof value !== 'string' || value.length > 4096) return null;
    try {
        const url = new URL(value);
        return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
    } catch { return null; }
}

export function normalizeUrl(value) {
    if (typeof value !== 'string') return null;
    const text = value.trim();
    if (!text || /^(?!https?:)[a-z][a-z\d+.-]*:/i.test(text)) return null;
    return httpUrl(/^https?:\/\//i.test(text) ? text : `https://${text}`);
}

export function openUrl(value) {
    const url = httpUrl(value);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
}

export function faviconUrl(value, size = 64) {
    const url = httpUrl(value);
    return url ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(url).hostname)}&sz=${size}` : '';
}

export function videoId(value) {
    if (typeof value !== 'string') return null;
    const match = value.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]+)/);
    const id = match ? match[1] : value.trim();
    return /^[\w-]{11}$/.test(id) ? id : null;
}
