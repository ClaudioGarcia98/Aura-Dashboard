import { test, expect } from '@playwright/test';

const pixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const playerFixture = `<!doctype html><html><body><script>
window.commands = [];
addEventListener('message', event => {
    let data;
    try { data = JSON.parse(event.data); } catch { return; }
    if (data.event === 'listening') parent.postMessage(JSON.stringify({event:'onReady'}), event.origin);
    if (data.event === 'command') {
        window.commands.push(data);
        if (data.func === 'playVideo') parent.postMessage(JSON.stringify({event:'onStateChange', info:1}), event.origin);
    }
});
</script></body></html>`;

async function start(page, settings = {}) {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(prefs => {
        localStorage.setItem('dash_settings', JSON.stringify({ state: {
            language: 'en', showWeatherWidget: false, ...prefs,
        }, version: 1 }));
    }, settings);
    await page.route('https://graphql.anilist.co/**', async route => {
        const { variables } = route.request().postDataJSON();
        await route.fulfill({ json: { data: { Page: { pageInfo: { hasNextPage: false }, airingSchedules: [{
            airingAt: variables.start + 3600, episode: 1,
            media: { id: 1, idMal: 1, title: { english: 'Smoke Anime' }, coverImage: { large: pixel, medium: pixel },
                averageScore: 80, genres: [], description: 'A deterministic browser fixture.',
                trailer: { site: 'youtube', id: 'lTRiuFIWV54' }, isAdult: false },
        }] } } } });
    });
    await page.route('https://www.youtube.com/embed/**', route => route.fulfill({ contentType: 'text/html', body: playerFixture }));
    // Keep these checks independent of optional remote providers and network availability.
    await page.route('https://noembed.com/**', route => route.fulfill({ json: { title: 'Fixture station' } }));
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
    await page.goto('/');
    await expect(page.locator('#bootScreen')).toHaveCount(0);
    return errors;
}

test('desktop startup, background decode, focus tasks, and modal keyboard containment', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const errors = await start(page);
    await expect.poll(() => page.locator('video').evaluate(video => video.videoWidth)).toBeGreaterThan(0);
    await page.getByRole('textbox', { name: 'New focus task' }).fill('Browser smoke task');
    await page.getByRole('button', { name: 'Add focus task', exact: true }).click();
    await expect(page.getByText('Browser smoke task', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Toggle Settings Panel' }).click();
    await expect(page.getByRole('dialog', { name: 'Aura Settings' })).toBeVisible();
    await page.keyboard.press('Control+Space');
    await expect.poll(() => page.evaluate(() => document.activeElement.closest('[role="dialog"]')?.id)).toBe('settingsPanel');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+Space');
    await expect(page.locator('#searchInput')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
});

test('phone translated tab keys, trailer volume and teardown preserve the root Lofi player', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = await start(page, { language: 'pt-PT', volume: 0 });
    const lofi = page.locator('iframe[title="Transmissão Lofi de fundo"]');
    const originalPlayer = await lofi.elementHandle();
    await page.locator('#tab-lofi').click();
    await page.getByRole('button', { name: 'Reproduzir', exact: true }).click();
    await expect.poll(async () => (await (await originalPlayer.contentFrame()).evaluate(() => window.commands?.some(command => command.func === 'playVideo')))).toBe(true);
    await page.locator('#tab-settings').click();
    await page.keyboard.press('Home');
    await expect(page.locator('#tab-home')).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.locator('#tab-settings')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tab-home')).toBeFocused();
    await page.locator('#panel-home').getByRole('button', { name: 'Smoke Anime', exact: true }).click();
    await expect(page.locator('#panel-home iframe')).toHaveCount(1);
    // Home may scroll its navigation away while revealing the expanded card.
    // Keyboard focus reveals it again and advances to Anime.
    await page.locator('#tab-home').press('ArrowRight');
    await expect(page.locator('#panel-home iframe')).toHaveCount(0);
    await page.locator('#tab-home').click();
    await expect(page.locator('#panel-home iframe')).toHaveCount(0);
    await page.locator('#tab-anime').click();
    await page.locator('#panel-anime').getByRole('button', { name: 'Smoke Anime', exact: true }).click();
    const trailer = page.locator('#panel-anime iframe');
    await expect(trailer).toHaveCount(1);
    await expect(trailer).toHaveAttribute('src', /mute=1/);
    await expect.poll(async () => {
        const frame = await (await trailer.elementHandle()).contentFrame();
        return frame.evaluate(() => window.commands?.some(command => command.func === 'setVolume' && command.args[0] === 0));
    }).toBe(true);
    await page.locator('#tab-settings').click();
    await expect(page.locator('#panel-anime iframe')).toHaveCount(0);
    expect(await originalPlayer.evaluate(element => element.isConnected)).toBe(true);
    await page.locator('#tab-anime').click();
    await expect(page.locator('#panel-anime iframe')).toHaveCount(0);
    await page.locator('#tab-lofi').click();
    await expect(page.getByRole('button', { name: 'Pausar', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
});

test('reload recovers a previously saved corrupt wallpaper and decodes valid image uploads', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const errors = await start(page);
    await page.evaluate(() => new Promise((resolve, reject) => {
        const request = indexedDB.open('dashDB', 1);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction('s', 'readwrite');
            transaction.objectStore('s').put(new Blob(['broken'], { type: 'video/mp4' }), 'bg');
            transaction.oncomplete = () => { db.close(); resolve(); };
            transaction.onerror = () => { db.close(); reject(transaction.error); };
        };
        request.onerror = () => reject(request.error);
    }));
    await page.reload();
    await expect(page.getByRole('status')).toContainText('default background has been restored');
    await expect.poll(() => page.locator('video').evaluate(video => video.videoWidth)).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Toggle Settings Panel' }).click();
    await page.locator('input[type="file"][accept*="video/mp4"]').setInputFiles({
        name: 'valid.gif', mimeType: 'image/gif', buffer: Buffer.from(pixel.split(',')[1], 'base64'),
    });
    await expect(page.getByText('valid.gif', { exact: true })).toBeVisible();
    await expect(page.locator('video')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.body.style.backgroundImage)).toContain('blob:');
    expect(errors).toEqual([]);
});

test('invalid wallpaper upload leaves the working animation intact', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const errors = await start(page);
    const original = await page.locator('video').getAttribute('src');
    await page.getByRole('button', { name: 'Toggle Settings Panel' }).click();
    await page.locator('input[type="file"][accept*="video/mp4"]').setInputFiles({
        name: 'broken.mp4', mimeType: 'video/mp4', buffer: Buffer.from('not a video'),
    });
    await expect(page.getByRole('alert')).toContainText(/background|video|media/i);
    await expect(page.locator('video')).toHaveAttribute('src', original);
    expect(errors).toEqual([]);
});
