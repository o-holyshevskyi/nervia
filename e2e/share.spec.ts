import { test, expect, Page } from '@playwright/test';

// ──────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────

const MOCK_NODES = [
  { id: 'n1', title: 'AI Ideas', content: 'Ideas for AI features.', type: 'idea', group: 2, tags: ['ai', 'roadmap'] },
  { id: 'n2', title: 'Design System', content: 'Components and tokens.', type: 'note', group: 1, tags: ['design', 'ui'] },
  { id: 'n3', title: 'API Docs', content: 'REST reference.', type: 'link', url: 'https://api.example.com', group: 1, tags: ['api', 'dev'] },
];

const MOCK_LINKS = [
  { source: 'n1', target: 'n2', relationType: 'manual', label: 'related', weight: 1 },
];

const MOCK_GROUPS = [
  { id: 'g-ai', name: 'AI', color: '#10b981' },
];

/** Intercept /api/share/:slug and return mock graph data. */
async function mockShareApi(page: Page, slug: string, overrides: Record<string, unknown> = {}) {
  await page.route(`**/api/share/${slug}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        nodes: MOCK_NODES,
        links: MOCK_LINKS,
        groups: MOCK_GROUPS,
        ...overrides,
      }),
    })
  );
  // Swallow the visit-ping request
  await page.route('**/api/notifications/visit', (route) => route.fulfill({ status: 200, body: '{}' }));
}

/** Wait for the loading spinner to disappear — indicates data has loaded. */
async function waitForShareLoad(page: Page) {
  await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15_000 });
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

test.describe('Share view page', () => {
  // ──────────────────────────────────────────────
  // Successful share load
  // ──────────────────────────────────────────────

  test.describe('with valid share data', () => {
    test.beforeEach(async ({ page }) => {
      await mockShareApi(page, 'abc123');
      await page.goto('/share/abc123');
      await waitForShareLoad(page);
    });

    test('renders the graph canvas', async ({ page }) => {
      await expect(page.locator('canvas')).toBeVisible();
    });

    test('shows the "Shared view" label in the sidebar', async ({ page }) => {
      await expect(page.getByText(/shared view/i)).toBeVisible();
    });

    test('displays the search input in the sidebar', async ({ page }) => {
      await expect(page.getByPlaceholder(/filter by title or tag/i)).toBeVisible();
    });

    test('shows the "Intelligence Shared via Nervia" footer branding', async ({ page }) => {
      // The parent div has aria-hidden so we query by DOM text, not aria role
      await expect(page.locator('a', { hasText: /intelligence shared via nervia/i })).toBeVisible();
    });

    test('footer branding links back to /', async ({ page }) => {
      // aria-hidden parent → locate anchor by href, not role
      const link = page.locator('a[href="/"]', { hasText: /shared via nervia/i });
      await expect(link).toBeVisible();
    });

    // ──────────────────────────────────────────────
    // Tag filter panel
    // ──────────────────────────────────────────────

    test('renders tag badges for each unique tag in the data', async ({ page }) => {
      // Unique tags across mock nodes: ai, roadmap, design, ui, api, dev
      for (const tag of ['ai', 'roadmap', 'design', 'ui', 'api', 'dev']) {
        await expect(page.getByText(tag, { exact: true })).toBeVisible();
      }
    });

    // ──────────────────────────────────────────────
    // Search
    // ──────────────────────────────────────────────

    test('accepts text in the search input', async ({ page }) => {
      const input = page.getByPlaceholder(/filter by title or tag/i);
      await input.fill('AI');
      await expect(input).toHaveValue('AI');
    });

    // ──────────────────────────────────────────────
    // Sidebar toggle
    // ──────────────────────────────────────────────

    test('closes the sidebar when the X button is clicked', async ({ page }) => {
      // CloseButton renders a plain <button><X/></button> with no aria-label.
      // Navigate up from the "Shared view" span to its flex-row parent div,
      // then find the only button sibling — this avoids matching tag buttons.
      await expect(page.getByText('Shared view')).toBeVisible();
      const closeBtn = page.getByText('Shared view').locator('xpath=..').getByRole('button');
      await closeBtn.click();
      await expect(page.getByText('Shared view')).not.toBeVisible({ timeout: 5_000 });
    });

    test('shows the "Filters" button after the sidebar is closed', async ({ page }) => {
      const closeBtn = page.getByText('Shared view').locator('xpath=..').getByRole('button');
      await closeBtn.click();
      await expect(page.getByRole('button', { name: /filters/i })).toBeVisible({ timeout: 5_000 });
    });

    test('reopens the sidebar when "Filters" is clicked', async ({ page }) => {
      const closeBtn = page.getByText('Shared view').locator('xpath=..').getByRole('button');
      await closeBtn.click();
      await expect(page.getByText('Shared view')).not.toBeVisible({ timeout: 5_000 });

      await page.getByRole('button', { name: /filters/i }).click();
      await expect(page.getByText('Shared view')).toBeVisible({ timeout: 5_000 });
    });

    // ──────────────────────────────────────────────
    // Visit ping
    // ──────────────────────────────────────────────

    test('sends exactly one visit ping on initial load', async ({ page }) => {
      let pingCount = 0;
      await page.route('**/api/notifications/visit', (route) => {
        pingCount++;
        route.fulfill({ status: 200, body: '{}' });
      });

      await page.goto('/share/abc123');
      await waitForShareLoad(page);
      // Allow background fetches to settle
      await page.waitForTimeout(500);

      expect(pingCount).toBe(1);
    });
  });

  // ──────────────────────────────────────────────
  // Error states
  // ──────────────────────────────────────────────

  test.describe('with a 404 share response', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/share/notfound', (route) =>
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Share not found' }),
        })
      );
      await page.goto('/share/notfound');
      await waitForShareLoad(page);
    });

    test('shows the "Share not found" error message', async ({ page }) => {
      await expect(page.getByText(/share not found/i)).toBeVisible();
    });

    test('shows a link back to the home page', async ({ page }) => {
      const link = page.getByRole('link', { name: /go to nervia/i });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', '/');
    });

    test('does not render the graph canvas', async ({ page }) => {
      await expect(page.locator('canvas')).not.toBeVisible();
    });
  });

  test.describe('with a network error response', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/share/broken', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        })
      );
      await page.goto('/share/broken');
      await waitForShareLoad(page);
    });

    test('shows a generic error message', async ({ page }) => {
      await expect(page.getByText(/failed to load/i)).toBeVisible();
    });
  });

  // ──────────────────────────────────────────────
  // Empty share (no nodes)
  // ──────────────────────────────────────────────

  test.describe('with an empty share (no nodes)', () => {
    test.beforeEach(async ({ page }) => {
      await mockShareApi(page, 'empty', { nodes: [], links: [], groups: [] });
      await page.goto('/share/empty');
      await waitForShareLoad(page);
    });

    test('renders successfully (canvas visible)', async ({ page }) => {
      await expect(page.locator('canvas')).toBeVisible();
    });

    test('shows "No tags" when there are no tags', async ({ page }) => {
      await expect(page.getByText(/no tags/i)).toBeVisible();
    });
  });
});
