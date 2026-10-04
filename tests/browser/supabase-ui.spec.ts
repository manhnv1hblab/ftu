import { expect, test } from '@playwright/test';

test('auth and community review entry points are available in guest mode', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: /Đăng nhập/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /chế độ khách/i })).toBeVisible();

  await page.goto('/reviews');
  await expect(page.getByRole('heading', { name: /Kinh nghiệm trao đổi/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Chia sẻ trải nghiệm/i })).toBeVisible();
});

test('rejected Sciences Po source rows are not shown as approved equivalences', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/partners/sciences-po');
  await expect(page.getByText('K7IM 2030A', { exact: true })).toHaveCount(0);
});
