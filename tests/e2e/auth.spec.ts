import { expect, test } from '@playwright/test';

test.describe('auth screens', () => {
  test('registration requires matching repeated password', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Display name').fill('Iris');
    await page.getByLabel('Email').fill('iris@example.com');
    await page.getByLabel('Password', { exact: true }).fill('StrongPass1!');
    await page.getByLabel('Repeat password').fill('DifferentPass1!');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Passwords do not match.')).toBeVisible();
  });

  test('login screen keeps account tabs usable with focused fields', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('iris@example.com');
    await page.getByRole('link', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('heading', { name: 'Light your first flame.' })).toBeVisible();
  });
});
