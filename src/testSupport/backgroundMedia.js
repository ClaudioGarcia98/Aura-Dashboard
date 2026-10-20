import { vi } from 'vitest';

// A real, complete 1 × 1 GIF, rather than arbitrary bytes labelled as an image.
export const GIF_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
export const gifBlob = () => new Blob([Uint8Array.from(atob(GIF_BASE64), c => c.charCodeAt(0))], { type: 'image/gif' });

// jsdom has no image/video codecs. Drive the same browser load/error events
// explicitly, while real browser smoke tests exercise actual decoding.
export function mockMediaDecoder({ automatic = true } = {}) {
    const images = [];
    const videos = [];
    vi.stubGlobal('Image', class {
        naturalWidth = 1;
        naturalHeight = 1;
        constructor() { images.push(this); }
        set src(value) { if (value && automatic) queueMicrotask(() => this.onload?.()); }
    });
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((name, options) => {
        const element = createElement(name, options);
        if (name === 'video') {
            videos.push(element);
            Object.defineProperties(element, { videoWidth: { value: 1280 }, videoHeight: { value: 720 }, duration: { value: 1 } });
            vi.spyOn(element, 'load').mockImplementation(() => {
                if (element.getAttribute('src') && automatic) queueMicrotask(() => element.onloadeddata?.());
            });
        }
        return element;
    });
    return { images, videos };
}
