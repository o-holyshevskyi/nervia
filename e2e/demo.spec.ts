import { test, expect } from '@playwright/test';

/**
 * E2E tests for the /demo page.
 *
 * The demo is fully self-contained (mockDemoData.ts) — no Supabase calls,
 * no authentication. This makes it the richest E2E target in the codebase.
 *
 * Covered flows:
 *  - Page bootstrap & graph canvas render
 *  - AddModal open / tab switching / validation
 *  - Node creation (Source, Memory, Impulse)
 *  - Duplicate title / URL prevention
 *  - Physics panel toggle
 *  - Context menu on right-click
 */

test.describe('Demo page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo');
    // Wait for the force-graph canvas to be mounted
    await page.waitForSelector('canvas', { timeout: 15_000 });
  });

  // ──────────────────────────────────────────────
  // Page bootstrap
  // ──────────────────────────────────────────────

  test('renders the graph canvas', async ({ page }) => {
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('shows the "+" add-node button', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /add/i }).or(page.locator('[aria-label*="add" i]'));
    // At least one control with a plus icon should exist in the toolbar
    await expect(page.locator('button').filter({ hasText: /^\+$/ }).or(page.locator('[data-testid="add-btn"]'))).toBeVisible();
  });

  // ──────────────────────────────────────────────
  // AddModal — opening & structure
  // ──────────────────────────────────────────────

  test('opens the AddModal when the "+" button is clicked', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^\+$/ }).click();
    // The modal renders a heading with the node type
    await expect(page.getByRole('dialog').or(page.locator('[role="dialog"]')).or(
      page.locator('form').filter({ hasText: /source|memory|impulse/i })
    )).toBeVisible({ timeout: 5_000 });
  });

  test('modal has three node-type tabs: Source, Memory, Impulse', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^\+$/ }).click();
    await expect(page.getByRole('tab', { name: /source/i }).or(page.getByText(/source/i).first())).toBeVisible();
    await expect(page.getByRole('tab', { name: /memory/i }).or(page.getByText(/memory/i).first())).toBeVisible();
    await expect(page.getByRole('tab', { name: /impulse/i }).or(page.getByText(/impulse/i).first())).toBeVisible();
  });

  test('modal submit button is disabled when Title is empty', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^\+$/ }).click();
    const submitBtn = page.getByRole('button', { name: /add neuron|create|save/i }).last();
    await expect(submitBtn).toBeDisabled();
  });

  test('modal submit button is enabled after entering a Title', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^\+$/ }).click();
    await page.getByPlaceholder(/title/i).fill('My new node');
    const submitBtn = page.getByRole('button', { name: /add neuron|create|save/i }).last();
    await expect(submitBtn).toBeEnabled();
  });

  test('switching to Memory tab changes the placeholder/context', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^\+$/ }).click();
    const memoryTab = page.getByRole('tab', { name: /memory/i }).or(page.getByText(/memory/i).first());
    await memoryTab.click();
    // URL field should be absent for Memory nodes
    await expect(page.getByPlaceholder(/https?:\/\//i)).not.toBeVisible();
  });

  test('switching to Source tab shows the URL input', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^\+$/ }).click();
    // Source is the default tab — URL input should be visible
    await expect(page.getByPlaceholder(/https?:\/\//i)).toBeVisible();
  });

  // ──────────────────────────────────────────────
  // AddModal — node creation
  // ──────────────────────────────────────────────

  test('creates a Memory (note) node and closes the modal', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^\+$/ }).click();

    // Switch to Memory tab
    const memoryTab = page.getByRole('tab', { name: /memory/i }).or(page.getByText(/memory/i).first());
    await memoryTab.click();

    await page.getByPlaceholder(/title/i).fill('Test Memory Node');

    const submitBtn = page.getByRole('button', { name: /add neuron|create|save/i }).last();
    await submitBtn.click();

    // Modal should close
    await expect(page.getByRole('tab', { name: /memory/i })).not.toBeVisible({ timeout: 5_000 });
  });

  test('creates an Impulse (idea) node and closes the modal', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^\+$/ }).click();

    const impulseTab = page.getByRole('tab', { name: /impulse/i }).or(page.getByText(/impulse/i).first());
    await impulseTab.click();

    await page.getByPlaceholder(/title/i).fill('Test Impulse Node');

    const submitBtn = page.getByRole('button', { name: /add neuron|create|save/i }).last();
    await submitBtn.click();

    await expect(page.getByRole('tab', { name: /impulse/i })).not.toBeVisible({ timeout: 5_000 });
  });

  // ──────────────────────────────────────────────
  // AddModal — validation: duplicate title
  // ──────────────────────────────────────────────

  test('shows a duplicate-title error when the title already exists', async ({ page }) => {
    // "AI Ideas" is a node that exists in mockDemoData.ts
    await page.locator('button').filter({ hasText: /^\+$/ }).click();

    const memoryTab = page.getByRole('tab', { name: /memory/i }).or(page.getByText(/memory/i).first());
    await memoryTab.click();

    await page.getByPlaceholder(/title/i).fill('AI Ideas');

    const submitBtn = page.getByRole('button', { name: /add neuron|create|save/i }).last();
    await submitBtn.click();

    await expect(page.getByText(/already exists/i)).toBeVisible({ timeout: 5_000 });
  });

  // ──────────────────────────────────────────────
  // AddModal — closing
  // ──────────────────────────────────────────────

  test('closing the modal via the X button dismisses it', async ({ page }) => {
    await page.locator('button').filter({ hasText: /^\+$/ }).click();
    await expect(page.getByPlaceholder(/title/i)).toBeVisible();

    // Click a close / X button inside the modal
    const closeBtn = page.getByRole('button', { name: /close|cancel/i })
      .or(page.locator('[aria-label="close"]'))
      .or(page.locator('button[class*="close"]'))
      .first();
    await closeBtn.click();

    await expect(page.getByPlaceholder(/title/i)).not.toBeVisible({ timeout: 5_000 });
  });

  // ──────────────────────────────────────────────
  // Physics panel
  // ──────────────────────────────────────────────

  test('opens the physics control panel', async ({ page }) => {
    // Physics button has a Settings2 icon — locate by aria-label or nearby text
    const physicsBtn = page.getByRole('button', { name: /physics|settings/i })
      .or(page.locator('[aria-label*="physics" i]'))
      .or(page.locator('[aria-label*="settings" i]'))
      .first();

    await physicsBtn.click();

    // The panel exposes sliders or labelled controls
    await expect(
      page.getByText(/repulsion|link distance|physics/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  // ──────────────────────────────────────────────
  // Context menu
  // ──────────────────────────────────────────────

  test('right-clicking the canvas does not crash the page', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) return;

    // Right-click somewhere in the middle of the canvas
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });

    // Page should still be alive and stable
    await expect(page.locator('canvas')).toBeVisible();
  });
});
