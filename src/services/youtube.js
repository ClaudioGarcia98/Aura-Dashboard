export const YOUTUBE_ORIGIN = 'https://www.youtube.com';

export function youtubeEmbedOrigin() {
    const origin = globalThis.window?.location?.origin;
    return origin && origin !== 'null' ? origin : 'http://localhost';
}

export function sendYouTubeCommand(iframe, func, args = []) {
    iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), YOUTUBE_ORIGIN);
}

export function listenYouTubePlayer(iframe) {
    iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), YOUTUBE_ORIGIN);
}

export function readYouTubeMessage(event, iframe) {
    const player = iframe?.contentWindow;
    if (!player || event?.origin !== YOUTUBE_ORIGIN || event.source !== player) return null;
    try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        return data && typeof data === 'object' && !Array.isArray(data) && typeof data.event === 'string' ? data : null;
    } catch { return null; }
}

export function isYouTubeReadyMessage(data) {
    return ['onReady', 'initialDelivery', 'infoDelivery'].includes(data?.event);
}

export function applyYouTubeVolume(iframe, volume, muted = false) {
    const level = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0;
    sendYouTubeCommand(iframe, muted || level === 0 ? 'mute' : 'unMute');
    sendYouTubeCommand(iframe, 'setVolume', [Math.round(level * 100)]);
}
