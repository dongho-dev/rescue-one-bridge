import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:4173',
    screenshot: 'only-on-failure',
    trace: process.env.CI ? 'on-first-retry' : 'off',
  },
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['list']],
  webServer: {
    command: 'npx tsc -b && npx vite build --mode test && npx vite preview --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
