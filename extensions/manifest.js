// Shared by the build and package validator. All application code ships locally.
export const API_ORIGINS = [
    'https://graphql.anilist.co',
    'https://aura-mal-api.claudio091998.workers.dev',
    'https://api.open-meteo.com',
    'https://geocoding-api.open-meteo.com',
    'https://ipapi.co',
    'https://animechan.io',
    'https://suggestqueries.google.com',
    'https://noembed.com',
];

export const EXTENSION_TARGETS = ['chromium', 'firefox'];

export function createManifest(target, version) {
    if (!EXTENSION_TARGETS.includes(target)) throw new Error(`Unknown extension target: ${target}`);
    const manifest = {
        manifest_version: 3,
        name: 'Good Morning — Aura',
        version,
        description: 'A cozy, local-first new tab with a clock, focus timer, weather, anime schedule, and your favorite shortcuts.',
        homepage_url: 'https://claudiogarcia98.github.io/Aura-Dashboard/',
        chrome_url_overrides: { newtab: 'index.html' },
        icons: Object.fromEntries([16, 32, 48, 128].map(size => [size, `icons/${size}.png`])),
        optional_permissions: ['geolocation'],
        host_permissions: API_ORIGINS.map(origin => `${origin}/*`),
        content_security_policy: {
            extension_pages: [
                "default-src 'self'",
                "script-src 'self'",
                "object-src 'none'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob: https:",
                "media-src 'self' data: blob:",
                "font-src 'self'",
                `connect-src 'self' ${API_ORIGINS.join(' ')}`,
                'frame-src https://www.youtube.com',
                "base-uri 'none'",
                "form-action 'none'",
            ].join('; ') + ';',
        },
    };
    if (target === 'firefox') {
        manifest.browser_specific_settings = {
            gecko: {
                id: 'aura-dashboard@claudiogarcia98',
                strict_min_version: '142.0',
                data_collection_permissions: {
                    required: ['none'],
                    optional: ['locationInfo', 'authenticationInfo', 'searchTerms', 'browsingActivity'],
                },
            },
        };
    }
    return manifest;
}
