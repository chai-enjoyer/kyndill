import { expect, test, type Locator, type Page } from '@playwright/test';
import { captureForReport, mockAuthenticatedApp } from './mockApp';

const pages = [
  { path: '/', name: 'dashboard', heading: /Good (morning|afternoon|evening), Iris\./ },
  { path: '/progress', name: 'progress', heading: 'Progress' },
  { path: '/habits', name: 'habits', heading: 'Habits' },
  { path: '/pet', name: 'pet', heading: 'Nova' },
  { path: '/shop', name: 'shop', heading: 'Kyndill Shop' },
  { path: '/friends', name: 'friends', heading: 'Friends' },
  { path: '/leaderboard', name: 'leaderboard', heading: 'Leaderboard' },
  { path: '/focus', name: 'focus', heading: 'Focus session' },
  { path: '/profile', name: 'profile', heading: 'Profile' },
  { path: '/settings', name: 'settings', heading: 'Settings' },
] as const;

/**
 * The dashboard renders both a mobile (.m-dashboard) tree and the legacy
 * desktop tree (.dashboard__main) in the same DOM; CSS toggles which one
 * is visible per breakpoint. Strict-mode `getByRole` would fail because
 * the greeting heading appears in both. This helper grabs whichever
 * heading is currently visible, regardless of DOM order.
 */
function visibleHeading(page: Page, name: string | RegExp): Locator {
  const isString = typeof name === 'string';
  /* `.filter({ visible: true })` (Playwright 1.42+) filters the matched
   * set to only DOM elements that are actually rendered. Without it the
   * dashboard would hit strict-mode violations because the greeting
   * heading exists in both mobile and desktop trees. */
  return page
    .getByRole('heading', { name, exact: isString })
    .filter({ visible: true })
    .first();
}

test.describe('authenticated app pages', () => {
  for (const pageCase of pages) {
    test(`${pageCase.name} renders with mocked production data`, async ({ page }, testInfo) => {
      await mockAuthenticatedApp(page);
      await page.goto(pageCase.path);

      /* Generous heading timeout so first-render pages (settings, in
       * particular, which lazy-mounts a tall form with several network
       * requests) don't flake on the dev server's cold start. */
      await expect(visibleHeading(page, pageCase.heading)).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('body')).not.toContainText('Could not load');
      await expect(page.locator('body')).not.toContainText('UNMOCKED_ROUTE');

      await captureForReport(page, testInfo, pageCase.name);
    });
  }

  /**
   * Habit completion is a desktop-flow assertion. The mobile tree uses a
   * hold-press gesture with different markup; testing both flows is out
   * of scope for this smoke suite. We pin the viewport to a desktop size
   * so the assertion targets the desktop habit-item / native checkbox.
   */
  test('dashboard completion flow shows feedback and item-drop context', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await mockAuthenticatedApp(page);
    await page.goto('/');

    const waterCard = page.locator('.dashboard__main .habit-item').filter({ hasText: 'Drink water' });
    await expect(waterCard).toBeVisible();
    await waterCard.getByRole('checkbox').click();

    await expect(page.getByRole('dialog', { name: 'How did that feel?' })).toBeVisible();
    await expect(page.getByText('Optional feedback for "Drink water"')).toBeVisible();
    await page.getByRole('button', { name: 'Skip' }).click();
    await expect(page.getByText('Item found')).toBeVisible();
    await expect(page.getByText('Warm Soup', { exact: true })).toBeVisible();

    await captureForReport(page, testInfo, 'dashboard-completion-flow');
  });

  test('friends page opens social modals without exposing private habit names', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await mockAuthenticatedApp(page);
    await page.goto('/friends');

    await page.getByRole('button', { name: 'View Profile' }).first().click();
    await expect(page.getByRole('dialog', { name: 'Mika Stone' })).toBeVisible();
    await expect(page.getByText('Total habits')).toBeVisible();
    await expect(page.getByText('Morning walk')).not.toBeVisible();

    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Add Friend' }).click();
    const search = page.waitForResponse((resp) =>
      resp.url().includes('/api/user/search') && resp.request().method() === 'GET',
    );
    await page.getByPlaceholder('Search username').fill('re');
    await search;
    await expect(page.getByRole('button', { name: 'Send Request' })).toBeVisible();

    await captureForReport(page, testInfo, 'friends-social-modals');
  });

  test('pet page can unequip a cosmetic slot', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await mockAuthenticatedApp(page);
    await page.goto('/pet');

    /* Wait for the initial /api/pet GET before clicking; without this
     * the slot button briefly renders with the wrong aria-label
     * ("Hat slot, empty") while pet data is loading, and Playwright's
     * auto-wait can pin on that stale state. */
    await page.waitForResponse(
      (resp) => resp.url().endsWith('/api/pet') && resp.request().method() === 'GET',
    );

    await page.getByRole('button', { name: /Hat slot, equipped/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Equip Hat' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Currently equipped')).toBeVisible();

    /* Wait for the unequip API call directly instead of relying on the
     * toast; toasts have auto-dismiss timers (~3s) and can be torn
     * down before the next assertion polls, producing flake across
     * browsers. The API response is a stable handshake. */
    const unequip = page.waitForResponse((resp) =>
      resp.url().endsWith('/api/pet/unequip') && resp.request().method() === 'POST',
    );
    await dialog.getByRole('button', { name: 'Unequip' }).click();
    await unequip;

    /* Close the modal so the slot card behind it isn't visually covered
     * by the backdrop when we check its new aria-label. */
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await expect(page.getByRole('button', { name: /Hat slot, empty/ })).toBeVisible();

    await captureForReport(page, testInfo, 'pet-unequip-cosmetic');
  });

  /**
   * Mobile chrome assertions, post-rebuild:
   *  - BottomNav still uses aria-label="Primary mobile" and exposes the
   *    four primary destinations (Home, Habits, Focus, Friends) + a More
   *    menu containing Shop / Leaderboard / Progress / Pet.
   *  - Profile MOVED out of the More menu; it now lives on the mobile
   *    page-header avatar link (aria-label "Profile, level N").
   *  - Settings is also out of More; accessible via the page-header
   *    gear icon.
   *  - Sign out is still appended at the bottom of the More menu.
   */
  test('mobile navigation keeps core destinations reachable', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAuthenticatedApp(page);
    await page.goto('/');

    const mobileNav = page.getByRole('navigation', { name: 'Primary mobile' });
    await expect(mobileNav).toBeVisible();
    for (const label of ['Home', 'Habits', 'Focus', 'Friends']) {
      await expect(mobileNav.getByRole('link', { name: label })).toBeVisible();
    }
    await expect(mobileNav.getByRole('button', { name: 'More' })).toBeVisible();

    // More menu still owns the secondary routes.
    await mobileNav.getByRole('button', { name: 'More' }).click();
    const moreMenu = page.getByRole('menu', { name: 'More navigation' });
    await expect(moreMenu).toBeVisible();
    for (const label of ['Shop', 'Leaderboard', 'Progress', 'Pet']) {
      await expect(moreMenu.getByRole('menuitem', { name: label })).toBeVisible();
    }
    // Profile is intentionally NOT in More any more; it lives on the
    // page-header avatar. Confirm both pieces of that contract.
    await expect(moreMenu.getByRole('menuitem', { name: 'Profile' })).toHaveCount(0);
    await expect(moreMenu.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();

    await moreMenu.getByRole('menuitem', { name: 'Leaderboard' }).click();
    await expect(visibleHeading(page, 'Leaderboard')).toBeVisible();

    await mobileNav.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: 'Shop' }).click();
    await expect(visibleHeading(page, 'Kyndill Shop')).toBeVisible();

    // Profile via the mobile page-header avatar.
    await page.getByRole('link', { name: /Profile, level/ }).click();
    await expect(visibleHeading(page, 'Profile')).toBeVisible();

    await captureForReport(page, testInfo, 'mobile-navigation');
  });
});
