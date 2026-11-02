import { test, expect } from '@playwright/test';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

const extensionPath = resolve('dist-extensions/chromium');
const pixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
// This fixture tests our iframe protocol only. Real YouTube playback is a
// separate, network-dependent release check documented in docs/extensions.md.
const playerFixture = `<!doctype html><html><body><script>
addEventListener('message', event => {
    let message;
    try { message = JSON.parse(event.data); } catch { return; }
    if (message.event === 'listening') parent.postMessage(JSON.stringify({event:'onReady'}), event.origin);
    if (message.event === 'command' && message.func === 'playVideo') {
        parent.postMessage(JSON.stringify({event:'onStateChange', info:1}), event.origin);
    }
});
</script></body></html>`;

async function launch(chromium, testInfo, profile = testInfo.outputPath('profile')) {
    await access(resolve(extensionPath, 'manifest.json')).catch(() => {
        throw new Error('Build the unpacked extension first: npm run build:extension:chromium');
    });
    return chromium.launchPersistentContext(profile, {
        channel: 'chromium', headless: true,
        viewport: { width: 1440, height: 1000 }, locale: 'en-GB',
        args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
}

async function prepare(context, settings = {}, { offline = false } = {}) {
    const errors = [];
    const requests = new Set();
    const unexpectedRequests = [];
    context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
    await context.addInitScript(prefs => {
        if (!location.protocol.endsWith('-extension:')) return;
        window.extensionCspViolations = [];
        document.addEventListener('securitypolicyviolation', event => {
            window.extensionCspViolations.push(`${event.effectiveDirective}: ${event.blockedURI}`);
        });
        if (!localStorage.getItem('dash_settings')) {
            localStorage.setItem('dash_settings', JSON.stringify({ state: {
                language: 'en', showWeatherWidget: false, showQuote: false, ...prefs,
            }, version: 1 }));
        }
    }, settings);
    await context.route(/^https?:\/\//, async route => {
        const url = new URL(route.request().url());
        requests.add(url.hostname);
        if (offline) return route.abort('internetdisconnected');
        if (url.hostname === 'graphql.anilist.co') {
            const { variables } = route.request().postDataJSON();
            return route.fulfill({ json: { data: { Page: {
                pageInfo: { hasNextPage: false }, airingSchedules: [{
                    airingAt: variables.start + 3600, episode: 1,
                    media: { id: 1, idMal: 1, title: { english: 'Extension fixture anime' },
                        coverImage: { large: pixel, medium: pixel }, averageScore: 80, genres: [],
                        description: 'Deterministic API fixture.', isAdult: false,
                        trailer: { site: 'youtube', id: 'lTRiuFIWV54' } },
                }],
            } } } });
        }
        if (url.hostname === 'www.youtube.com' && url.pathname.startsWith('/embed/')) {
            return route.fulfill({ contentType: 'text/html', body: playerFixture });
        }
        if (url.hostname === 'noembed.com') return route.fulfill({ json: { title: 'Extension fixture station' } });
        if (url.hostname === 'api.open-meteo.com') return route.fulfill({ json: {
            current: { temperature_2m: 18, apparent_temperature: 17, relative_humidity_2m: 60,
                wind_speed_10m: 7, weather_code: 0, is_day: 1 },
        } });
        unexpectedRequests.push(url.href);
        return route.abort();
    });
    return { errors, requests, unexpectedRequests };
}

async function newTab(context) {
    const page = await context.newPage();
    // Exercise the browser's registered override, not a guessed extension URL.
    await page.goto('chrome://newtab/');
    await expect.poll(() => page.evaluate(() => location.protocol)).toBe('chrome-extension:');
    await expect(page.locator('#bootScreen')).toHaveCount(0);
    await expect(page.locator('#searchInput')).toBeVisible();
    return page;
}

async function assertClean(page, observations) {
    expect(await page.evaluate(() => window.extensionCspViolations)).toEqual([]);
    expect(observations.errors).toEqual([]);
    expect(observations.unexpectedRequests).toEqual([]);
}

test('registered new tab boots with packaged scripts, media and fonts under MV3 CSP', async ({ playwright }, testInfo) => {
    const context = await launch(playwright.chromium, testInfo);
    try {
        const observations = await prepare(context);
        const page = await newTab(context);
        const manifest = await page.evaluate(() => globalThis.chrome.runtime.getManifest());
        expect(manifest.manifest_version).toBe(3);
        expect(manifest.chrome_url_overrides.newtab).toBe('index.html');
        expect(await page.evaluate(() => location.pathname)).toBe('/index.html');
        await expect.poll(() => page.locator('video').evaluate(video => video.videoWidth)).toBeGreaterThan(0);
        await page.evaluate(() => document.fonts.ready);
        // A new-tab override should leave initial keyboard focus to the browser.
        await expect(page.locator('#searchInput')).not.toBeFocused();
        await expect.poll(() => observations.requests.has('graphql.anilist.co')).toBe(true);
        await expect(page.getByText('Extension fixture anime', { exact: true }).first()).toBeVisible();
        await page.getByRole('button', { name: 'Play', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
        await assertClean(page, observations);
    } finally { await context.close(); }
});

test('offline new tab keeps local tasks, settings and bundled background usable', async ({ playwright }, testInfo) => {
    const context = await launch(playwright.chromium, testInfo);
    try {
        const observations = await prepare(context, { font: 'raleway' }, { offline: true });
        await context.setOffline(true);
        const page = await newTab(context);
        await expect(page.locator('#gf-raleway')).toHaveAttribute('href', './fonts/raleway.css');
        await page.evaluate(() => document.fonts.load('400 16px Raleway'));
        expect(await page.evaluate(() => document.fonts.check('400 16px Raleway'))).toBe(true);
        await expect.poll(() => page.locator('video').evaluate(video => video.videoWidth)).toBeGreaterThan(0);
        await page.getByRole('textbox', { name: 'New focus task' }).fill('Offline priority');
        await page.getByRole('button', { name: 'Add focus task', exact: true }).click();
        await expect(page.getByText('Offline priority', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Toggle Settings Panel' }).click();
        await page.getByLabel('Display Name').fill('Offline user');
        await page.getByRole('button', { name: 'Close settings', exact: true }).click();
        await page.reload();
        await expect(page.locator('#bootScreen')).toHaveCount(0);
        await expect(page.getByText('Offline priority', { exact: true })).toBeVisible();
        await expect(page.locator('#greeting')).toContainText('Offline user');
        await assertClean(page, observations);
    } finally { await context.close(); }
});

test('settings and tasks update other open tabs and survive a browser restart', async ({ playwright }, testInfo) => {
    let context = await launch(playwright.chromium, testInfo);
    try {
        const observations = await prepare(context);
        const first = await newTab(context);
        const second = await newTab(context);
        await first.getByRole('button', { name: 'Toggle Settings Panel' }).click();
        await first.getByLabel('Display Name').fill('Shared profile');
        await first.getByRole('button', { name: 'Close settings', exact: true }).click();
        await expect(second.locator('#greeting')).toContainText('Shared profile');
        await first.getByRole('textbox', { name: 'New focus task' }).fill('Shared priority');
        await first.getByRole('button', { name: 'Add focus task', exact: true }).click();
        await expect(second.getByText('Shared priority', { exact: true })).toBeVisible();
        await assertClean(first, observations);
        await assertClean(second, observations);
        await context.close();
        context = await launch(playwright.chromium, testInfo);
        const restarted = await prepare(context);
        const page = await newTab(context);
        await expect(page.locator('#greeting')).toContainText('Shared profile');
        await expect(page.getByText('Shared priority', { exact: true })).toBeVisible();
        await assertClean(page, restarted);
    } finally { await context.close(); }
});

test('weather can use a selected city without GPS permission in the extension', async ({ playwright }, testInfo) => {
    const context = await launch(playwright.chromium, testInfo);
    try {
        const observations = await prepare(context, { showWeatherWidget: true,
            fallbackCity: 'London', fallbackCityLocation: { city: 'London', lat: 51.5072, lon: -0.1276 } });
        const page = await newTab(context);
        await expect(page.getByText('18°C', { exact: true }).first()).toBeVisible();
        expect(observations.requests.has('api.open-meteo.com')).toBe(true);
        expect(observations.requests.has('ipapi.co')).toBe(false);
        await assertClean(page, observations);
    } finally { await context.close(); }
});
