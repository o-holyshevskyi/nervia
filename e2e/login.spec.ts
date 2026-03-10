import { test, expect, Page } from '@playwright/test';

// Stub all Supabase auth API calls so tests don't need real credentials
async function stubSupabaseAuth(page: Page) {
  await page.route('**/auth/v1/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });
}

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await stubSupabaseAuth(page);
    await page.goto('/login');
  });

  // ──────────────────────────────────────────────
  // Page structure
  // ──────────────────────────────────────────────

  test('displays the Nervia heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome to Nervia' })).toBeVisible();
  });

  test('shows the tagline subtitle', async ({ page }) => {
    await expect(page.getByText('Sign in to access your visual intelligence universe')).toBeVisible();
  });

  test('Google OAuth button is visible and enabled', async ({ page }) => {
    const btn = page.getByRole('button', { name: /Continue with Google/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('GitHub OAuth button is visible and enabled', async ({ page }) => {
    const btn = page.getByRole('button', { name: /Continue with GitHub/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('email input is visible', async ({ page }) => {
    const input = page.getByPlaceholder('name@example.com');
    await expect(input).toBeVisible();
  });

  test('"Send Magic Link" button is disabled when email field is empty', async ({ page }) => {
    const btn = page.getByRole('button', { name: /Send Magic Link/i });
    await expect(btn).toBeDisabled();
  });

  // ──────────────────────────────────────────────
  // Email form interactions
  // ──────────────────────────────────────────────

  test('"Send Magic Link" button becomes enabled after typing an email', async ({ page }) => {
    await page.getByPlaceholder('name@example.com').fill('user@example.com');
    const btn = page.getByRole('button', { name: /Send Magic Link/i });
    await expect(btn).toBeEnabled();
  });

  test('email input accepts typed value', async ({ page }) => {
    const input = page.getByPlaceholder('name@example.com');
    await input.fill('hello@nervia.io');
    await expect(input).toHaveValue('hello@nervia.io');
  });

  test('clears the error banner when the user starts retyping', async ({ page }) => {
    // Stub auth to return an error on first call
    await page.route('**/auth/v1/otp**', (route) =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid email' }),
      })
    );

    await page.getByPlaceholder('name@example.com').fill('bad');
    await page.getByRole('button', { name: /Send Magic Link/i }).click();

    // Type a new character — error should clear
    await page.getByPlaceholder('name@example.com').type('x');
    await expect(page.locator('[class*="red"]')).toHaveCount(0);
  });

  // ──────────────────────────────────────────────
  // Success state
  // ──────────────────────────────────────────────

  test('shows success state after a successful magic-link submission', async ({ page }) => {
    // Stub OTP endpoint to return success
    await page.route('**/auth/v1/otp**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message_id: 'ok' }),
      })
    );

    await page.getByPlaceholder('name@example.com').fill('user@example.com');
    await page.getByRole('button', { name: /Send Magic Link/i }).click();

    await expect(page.getByText('Check your email')).toBeVisible();
    await expect(page.getByText('user@example.com')).toBeVisible();
  });

  test('"Try another way" button resets the success view', async ({ page }) => {
    await page.route('**/auth/v1/otp**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );

    await page.getByPlaceholder('name@example.com').fill('user@example.com');
    await page.getByRole('button', { name: /Send Magic Link/i }).click();
    await expect(page.getByText('Check your email')).toBeVisible();

    await page.getByRole('button', { name: /Try another way/i }).click();

    // Should be back to the sign-in form
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
    await expect(page.getByText('Check your email')).not.toBeVisible();
  });

  // ──────────────────────────────────────────────
  // Error state
  // ──────────────────────────────────────────────

  test('shows an error banner when the OTP request fails', async ({ page }) => {
    await page.route('**/auth/v1/otp**', (route) =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ msg: 'Signups not allowed for this instance' }),
      })
    );

    await page.getByPlaceholder('name@example.com').fill('user@example.com');
    await page.getByRole('button', { name: /Send Magic Link/i }).click();

    // The error banner references an AlertCircle icon — it must be visible
    await expect(page.locator('[class*="red"]').first()).toBeVisible();
  });

  // ──────────────────────────────────────────────
  // OAuth buttons disable during loading
  // ──────────────────────────────────────────────

  test('OAuth buttons are disabled while another OAuth request is in flight', async ({ page }) => {
    // Delay the Supabase OAuth redirect so we can inspect mid-flight state
    await page.route('**/auth/v1/authorize**', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      route.fulfill({ status: 200, contentType: 'text/html', body: '<html></html>' });
    });

    const googleBtn = page.getByRole('button', { name: /Continue with Google/i });
    const githubBtn = page.getByRole('button', { name: /Continue with GitHub/i });

    await googleBtn.click();

    await expect(googleBtn).toBeDisabled();
    await expect(githubBtn).toBeDisabled();
  });
});
