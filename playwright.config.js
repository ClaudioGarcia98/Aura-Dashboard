import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    retries: process.env.CI ? 1 : 0,
    workers: 2,
    use: { baseURL: 'http://localhost:5176', trace: 'retain-on-failure' },
    webServer: {
        command: 'npm run preview -- --host localhost --port 5176 --strictPort',
        url: 'http://localhost:5176',
        reuseExistingServer: !process.env.CI,
    },
});
