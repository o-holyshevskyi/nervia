import { test, expect } from '@playwright/test';

/**
 * E2E tests for the /demo page.
 *
 * The demo is fully self-contained (mockDemoData.ts) — no Supabase calls,
 * no authentication. This makes it the richest E2E target in the codebase.
 *
 * Key selectors derived from reading the source:
 *  - Add button      → button with text "New Neuron"
 *  - Type tabs       → plain <button> elements: "Source", "Memory", "Impulse"
 *  - Title input     → placeholder "e.g. My Portfolio" (Source tab) / "Title..." (others)
 *  - URL input       → placeholder "https://example.com"
 *  - Submit button   → "Save to universe"
 *  - Physics button  → aria-label="Physics settings"
 *  - Modal close     → CloseButton (X icon, no aria-label) — first button inside the modal header
 */

// Helper: opens the bottom "New Neuron" button and waits for the modal title
async function openAddModal(page: Parameters<Parameters<typeof test>[1]>[0]) {
  // The bottom-centre "New Neuron" button is always visible (no sidebar required)
  await page.getByRole('button', { name: /new neuron/i }).last().click();
  // Wait for the modal heading to confirm it opened
  await expect(page.getByRole('heading', { name: /new neuron/i })).toBeVisible({ timeout: 5_000 });
}

test.describe('Demo page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo');
    // Wait for the force-graph canvas to mount
    await page.waitForSelector('canvas', { timeout: 15_000 });
  });

  // ──────────────────────────────────────────────
  // Page bootstrap
  // ──────────────────────────────────────────────

  test('renders the graph canvas', async ({ page }) => {
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('shows the "New Neuron" add button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new neuron/i }).last()).toBeVisible();
  });

  // ──────────────────────────────────────────────
  // AddModal — opening & structure
  // ──────────────────────────────────────────────

  test('opens the AddModal when "New Neuron" is clicked', async ({ page }) => {
    await openAddModal(page);
    await expect(page.getByRole('heading', { name: /new neuron/i })).toBeVisible();
  });

  test('modal has three node-type buttons: Source, Memory, Impulse', async ({ page }) => {
    await openAddModal(page);
    // Tabs are plain <button> elements (not role=tab)
    await expect(page.getByRole('button', { name: /^source$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^memory$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^impulse$/i })).toBeVisible();
  });

  test('submit button is disabled when Title is empty (Source tab)', async ({ page }) => {
    await openAddModal(page);
    // Source tab is active by default; title placeholder is "e.g. My Portfolio"
    await expect(page.getByPlaceholder('e.g. My Portfolio')).toBeVisible();
    await expect(page.getByRole('button', { name: /save to universe/i })).toBeDisabled();
  });

  test('submit button is enabled after entering a title', async ({ page }) => {
    await openAddModal(page);
    await page.getByPlaceholder('e.g. My Portfolio').fill('My new node');
    await expect(page.getByRole('button', { name: /save to universe/i })).toBeEnabled();
  });

  test('Source tab (default) shows the URL input', async ({ page }) => {
    await openAddModal(page);
    await expect(page.getByPlaceholder('https://example.com')).toBeVisible();
  });

  test('switching to Memory tab hides the URL input and shows "Title..." placeholder', async ({ page }) => {
    await openAddModal(page);
    await page.getByRole('button', { name: /^memory$/i }).click();
    await expect(page.getByPlaceholder('https://example.com')).not.toBeVisible();
    await expect(page.getByPlaceholder('Title...')).toBeVisible();
  });

  test('switching to Impulse tab hides the URL input', async ({ page }) => {
    await openAddModal(page);
    await page.getByRole('button', { name: /^impulse$/i }).click();
    await expect(page.getByPlaceholder('https://example.com')).not.toBeVisible();
  });

  // ──────────────────────────────────────────────
  // AddModal — node creation
  // ──────────────────────────────────────────────

  test('creates a Memory node and closes the modal', async ({ page }) => {
    await openAddModal(page);
    await page.getByRole('button', { name: /^memory$/i }).click();
    await page.getByPlaceholder('Title...').fill('Test Memory Node');
    await page.getByRole('button', { name: /save to universe/i }).click();
    // Modal closes — heading disappears
    await expect(page.getByRole('heading', { name: /new neuron/i })).not.toBeVisible({ timeout: 5_000 });
  });

  test('creates an Impulse node and closes the modal', async ({ page }) => {
    await openAddModal(page);
    await page.getByRole('button', { name: /^impulse$/i }).click();
    await page.getByPlaceholder('Title...').fill('Test Impulse Node');
    await page.getByRole('button', { name: /save to universe/i }).click();
    await expect(page.getByRole('heading', { name: /new neuron/i })).not.toBeVisible({ timeout: 5_000 });
  });

  // ──────────────────────────────────────────────
  // AddModal — validation: duplicate title
  // ──────────────────────────────────────────────

  test('shows a duplicate-title error when the title already exists', async ({ page }) => {
    // "AI Ideas" exists in mockDemoData.ts
    await openAddModal(page);
    await page.getByRole('button', { name: /^memory$/i }).click();
    await page.getByPlaceholder('Title...').fill('AI Ideas');
    await page.getByRole('button', { name: /save to universe/i }).click();
    await expect(page.getByText(/already exists/i)).toBeVisible({ timeout: 5_000 });
  });

  // ──────────────────────────────────────────────
  // AddModal — closing
  // ──────────────────────────────────────────────

  test('closes the modal via the X button in the modal header', async ({ page }) => {
    await openAddModal(page);
    // CloseButton renders a plain <button><X/></button> with no aria-label.
    // It is the only button in the modal header row, so locate it by its
    // proximity to the "New Neuron" heading inside the dialog container.
    const heading = page.getByRole('heading', { name: /new neuron/i });
    // The heading and close button share a flex row — find the button sibling
    await heading.locator('..').getByRole('button').click();
    await expect(page.getByRole('heading', { name: /new neuron/i })).not.toBeVisible({ timeout: 5_000 });
  });

  // ──────────────────────────────────────────────
  // Physics panel
  // ──────────────────────────────────────────────

  test('opens the physics control panel via Physics settings button', async ({ page }) => {
    // The button lives inside the force-graph canvas overlay. Playwright's
    // pointer-based click can be intercepted by the Next.js dev portal or the
    // graph loading screen. Calling .click() directly through the DOM bypasses
    // both issues and reliably triggers React's synthetic event handler.
    await page.waitForFunction(
      () => !!document.querySelector('[aria-label="Physics settings"]')
    );
    await page.evaluate(() => {
      (document.querySelector('[aria-label="Physics settings"]') as HTMLElement)?.click();
    });
    // PhysicsControl renders "Physics of the Universe" as its heading
    await expect(page.getByText('Physics of the Universe')).toBeVisible({ timeout: 5_000 });
  });

  // ──────────────────────────────────────────────
  // Context menu
  // ──────────────────────────────────────────────

  test('right-clicking the canvas does not crash the page', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) return;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
    await expect(page.locator('canvas')).toBeVisible();
  });
});
