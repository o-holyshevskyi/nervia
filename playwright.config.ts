import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration.
 *
 * The test suite targets three public/mockable surfaces:
 *   - /login   (no auth required, Supabase calls mocked via page.route)
 *   - /demo    (no auth required, fully self-contained mock data)
 *   - /share/* (public share page, /api/share/* mocked via page.route)
 *
 * The Next.js dev server is started automatically before the run.
 * Dummy Supabase env vars are injected so the server can boot without
 * real credentials — the auth API is intercepted at the network level.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Inject dummy Supabase values so Next.js boots without real credentials.
    // All Supabase network calls are intercepted by page.route() in tests.
    command: [
      'NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key',
      'SUPABASE_SERVICE_ROLE_KEY=placeholder-service-key',
      'GEMINI_API_KEY=placeholder-gemini-key',
      'npm run dev',
    ].join(' '),
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
