import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyYouTubeVolume, isYouTubeReadyMessage, listenYouTubePlayer, readYouTubeMessage, sendYouTubeCommand, youtubeEmbedOrigin, YOUTUBE_ORIGIN } from './youtube';

afterEach(() => vi.unstubAllGlobals());

function player() {
    const postMessage = vi.fn();
    return { iframe: { contentWindow: { postMessage } }, postMessage };
}

describe('YouTube messages', () => {
    it('sends commands and listening handshakes to the exact YouTube origin', () => {
        const { iframe, postMessage } = player();
        listenYouTubePlayer(iframe);
        sendYouTubeCommand(iframe, 'playVideo');
        sendYouTubeCommand(iframe, 'seekTo', [0, true]);
        expect(postMessage.mock.calls).toEqual([
            [JSON.stringify({ event: 'listening' }), YOUTUBE_ORIGIN],
            [JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), YOUTUBE_ORIGIN],
            [JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }), YOUTUBE_ORIGIN],
        ]);
        expect(() => { sendYouTubeCommand(null, 'pauseVideo'); listenYouTubePlayer({}); }).not.toThrow();
    });

    it('accepts JSON and object messages only from the current player', () => {
        const { iframe } = player();
        const data = { event: 'onStateChange', info: 1 };
        for (const value of [data, JSON.stringify(data)]) {
            expect(readYouTubeMessage({ origin: YOUTUBE_ORIGIN, source: iframe.contentWindow, data: value }, iframe)).toEqual(data);
        }
        expect(readYouTubeMessage({ origin: 'https://example.com', source: iframe.contentWindow, data }, iframe)).toBeNull();
        expect(readYouTubeMessage({ origin: YOUTUBE_ORIGIN, source: player().iframe.contentWindow, data }, iframe)).toBeNull();
        expect(readYouTubeMessage({ origin: YOUTUBE_ORIGIN, source: null, data }, null)).toBeNull();
    });

    it.each(['{broken', 'null', '1', '[]', '{}', null, false, [], {}, { event: 1 }])('ignores malformed protocol data: %j', data => {
        const { iframe } = player();
        expect(readYouTubeMessage({ origin: YOUTUBE_ORIGIN, source: iframe.contentWindow, data }, iframe)).toBeNull();
    });

    it('recognizes readiness deliveries without treating state/error messages as ready', () => {
        for (const event of ['onReady', 'initialDelivery', 'infoDelivery']) expect(isYouTubeReadyMessage({ event })).toBe(true);
        for (const value of [null, {}, { event: 'onError' }, { event: 'onStateChange', info: 1 }]) expect(isYouTubeReadyMessage(value)).toBe(false);
    });
});

describe('YouTube volume', () => {
    it.each([
        [0, false, 'mute', 0], [0.375, false, 'unMute', 38], [0.7, true, 'mute', 70],
        [2, false, 'unMute', 100], [-1, false, 'mute', 0], [NaN, false, 'mute', 0],
    ])('normalizes volume %s with explicit mute=%s', (volume, muted, command, expected) => {
        const { iframe, postMessage } = player();
        applyYouTubeVolume(iframe, volume, muted);
        expect(postMessage.mock.calls.map(([data]) => JSON.parse(data))).toEqual([
            { event: 'command', func: command, args: [] },
            { event: 'command', func: 'setVolume', args: [expected] },
        ]);
    });
});

it('uses the hosting origin and provides a stable file-session fallback', () => {
    vi.stubGlobal('window', { location: { origin: 'https://aura.example' } });
    expect(youtubeEmbedOrigin()).toBe('https://aura.example');
    vi.stubGlobal('window', { location: { origin: 'null' } });
    expect(youtubeEmbedOrigin()).toBe('http://localhost');
    vi.stubGlobal('window', undefined);
    expect(youtubeEmbedOrigin()).toBe('http://localhost');
});
