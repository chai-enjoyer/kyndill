import { expect, test } from '@playwright/test';
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

test.describe('authenticated app pages', () => {
  for (const pageCase of pages) {
    test(`${pageCase.name} renders with mocked production data`, async ({ page }, testInfo) => {
      await mockAuthenticatedApp(page);
      await page.goto(pageCase.path);

      await expect(page.getByRole('heading', { name: pageCase.heading, exact: typeof pageCase.heading === 'string' })).toBeVisible();
      await expect(page.locator('body')).not.toContainText('Could not load');
      await expect(page.locator('body')).not.toContainText('UNMOCKED_ROUTE');

      await captureForReport(page, testInfo, pageCase.name);
    });
  }

  test('dashboard completion flow shows feedback and item-drop context', async ({ page }, testInfo) => {
    await mockAuthenticatedApp(page);
    await page.goto('/');

    const waterCard = page.locator('.habit-item').filter({ hasText: 'Drink water' });
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
    await mockAuthenticatedApp(page);
    await page.goto('/friends');

    await page.getByRole('button', { name: 'View Profile' }).first().click();
    await expect(page.getByRole('dialog', { name: 'Mika Stone' })).toBeVisible();
    await expect(page.getByText('Total habits')).toBeVisible();
    await expect(page.getByText('Morning walk')).not.toBeVisible();

    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Add Friend' }).click();
    await page.getByPlaceholder('Search username').fill('re');
    await expect(page.getByRole('button', { name: 'Send Request' })).toBeVisible();

    await captureForReport(page, testInfo, 'friends-social-modals');
  });

  test('pet page can unequip a cosmetic slot', async ({ page }, testInfo) => {
    await mockAuthenticatedApp(page);
    await page.goto('/pet');

    await page.getByRole('button', { name: /Hat slot, equipped/ }).click();
    await expect(page.getByRole('dialog', { name: 'Equip Hat' })).toBeVisible();
    await expect(page.getByText('Currently equipped')).toBeVisible();
    await page.getByRole('button', { name: 'Unequip' }).click();

    await expect(page.getByText('Cosmetic unequipped.')).toBeVisible();
    await expect(page.getByRole('button', { name: /Hat slot, empty/ })).toBeVisible();

    await captureForReport(page, testInfo, 'pet-unequip-cosmetic');
  });

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

    await mobileNav.getByRole('button', { name: 'More' }).click();
    await expect(page.getByRole('menu', { name: 'More navigation' })).toBeVisible();
    await page.getByRole('menuitem', { name: 'Leaderboard' }).click();
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();

    await mobileNav.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: 'Shop' }).click();
    await expect(page.getByRole('heading', { name: 'Kyndill Shop' })).toBeVisible();

    await mobileNav.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: 'Profile' }).click();
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

    await mobileNav.getByRole('button', { name: 'More' }).click();
    await expect(page.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();

    await captureForReport(page, testInfo, 'mobile-navigation');
  });
});
