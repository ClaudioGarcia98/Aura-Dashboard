import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e-extension',
    outputDir: './test-results-extension',
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    timeout: 45000,
    use: { viewport: { width: 1440, height: 1000 }, locale: 'en-GB' },
});
