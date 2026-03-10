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
    // Stub auth to return an error on OTP call
    await page.route('**/auth/v1/otp**', (route) =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid email' }),
      })
    );

    const emailInput = page.getByPlaceholder('name@example.com');
    await emailInput.fill('user@example.com');
    await page.getByRole('button', { name: /Send Magic Link/i }).click();

    // Wait for the error banner to appear
    await expect(page.locator('[class*="red"]').first()).toBeVisible({ timeout: 5_000 });

    // Retyping clears the error
    await emailInput.fill('user2@example.com');
    await expect(page.locator('[class*="red"]')).toHaveCount(0);
  });

  // ──────────────────────────────────────────────
  // Success state
  // ──────────────────────────────────────────────

  test('shows success state after a successful magic-link submission', async ({ page }) => {
    await page.route('**/auth/v1/otp**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message_id: 'ok' }),
      })
    );

    await page.getByPlaceholder('name@example.com').fill('user@example.com');
    await page.getByRole('button', { name: /Send Magic Link/i }).click();

    await expect(page.getByText('Check your email')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('user@example.com')).toBeVisible();
  });

  test('"Try another way" button resets the success view', async ({ page }) => {
    await page.route('**/auth/v1/otp**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );

    await page.getByPlaceholder('name@example.com').fill('user@example.com');
    await page.getByRole('button', { name: /Send Magic Link/i }).click();
    await expect(page.getByText('Check your email')).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: /Try another way/i }).click();

    // Back to the sign-in form
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

    await expect(page.locator('[class*="red"]').first()).toBeVisible({ timeout: 5_000 });
  });

  // ──────────────────────────────────────────────
  // OAuth button loading state
  // ──────────────────────────────────────────────

  test('clicking Google OAuth initiates the auth flow (redirects or shows an error)', async ({ page }) => {
    // signInWithOAuth constructs an OAuth URL locally (PKCE) and immediately
    // calls window.location.href — there is no observable loading-spinner window
    // in E2E because React flushes after the navigation is already queued.
    // Instead, verify the observable END state: either the page navigated away
    // (OAuth redirect started) or the Supabase call failed and an error is shown.
    let leftLogin = false;

    // Abort any cross-origin navigation (the OAuth provider redirect) so the
    // browser context stays alive for assertions.
    await page.route(/^(?!http:\/\/localhost).*/, (route) => {
      leftLogin = true;
      route.abort();
    });

    await page.getByRole('button', { name: /Continue with Google/i }).click();

    // Allow up to 3 s for the auth flow to settle
    await page.waitForTimeout(3_000);

    const hasError = (await page.locator('[class*="red"]').count()) > 0;

    // Either the OAuth redirect was attempted OR an auth error was displayed
    expect(leftLogin || hasError).toBe(true);
  });
});
