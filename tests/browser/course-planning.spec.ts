import { expect, test } from '@playwright/test';
import { fillProfile, clcProgram } from './profile-helpers';

test('Excel upload preserves course codes and passed status in course review', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/planner');
  await page.locator('#fileUploadInput').setInputFiles('public/templates/Mau_ChuongTrinhDaoTao_FTU.xlsx');
  await expect(page.getByText('Mau_ChuongTrinhDaoTao_FTU.xlsx')).toBeVisible();
  await page.getByRole('button', { name: /Tiếp tục: Rà soát môn học/ }).click();
  await page.getByRole('button', { name: /Đã tích lũy/ }).click();
  await expect(page.getByText('EAB111', { exact: true })).toBeVisible();
});

test('manual course codes stay unverified and saved plans survive profile edits and reloads', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/planner');
  await page.getByRole('button', { name: 'Nhập mã môn' }).click();
  await page.getByPlaceholder(/VD: KTE402/).fill('TCH321, TIN313, TCH412');
  await page.getByRole('button', { name: /Xác nhận & Tiếp tục/ }).click();

  await fillProfile(page);
  await page.getByRole('button', { name: /Tiếp tục khám phá trường/ }).click();
  await page.getByPlaceholder('Tìm theo tên trường, quốc gia...').fill('Millikin University');
  await page.getByRole('button', { name: 'Chọn & lập phương án' }).click();

  await expect(page.getByText(/chưa có tín chỉ trong hồ sơ/).first()).toBeVisible();
  await expect(page.getByText('Hồ sơ chỉ có mã môn hoặc thiếu tên/tín chỉ', { exact: false }).first()).toBeVisible();
  await page.getByRole('checkbox').first().check();

  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByText(/Đã lưu NV1 với trạng thái chưa đủ điều kiện/)).toBeVisible();

  await page.waitForTimeout(650);
  await page.reload();
  await expect(page.getByRole('checkbox').first()).toBeChecked();

  await page.getByRole('button', { name: /Rà soát hồ sơ/ }).click();
  await page.locator('#profile-program').selectOption(clcProgram.id);
  await page.getByRole('button', { name: /Gợi ý trường/ }).click();
  await expect(page.getByText('Millikin University').first()).toBeVisible();
  await page.getByRole('button', { name: /Lập phương án NV1/ }).click();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
  await expect(page.getByText(/Bản nháp đã lưu cần được đối chiếu lại/)).toBeVisible();
});
