import { expect, test } from '@playwright/test';
import { enterManualCourses, fillProfile } from './profile-helpers';
import { academicPrograms, graduationYears, resolveProgramType } from '../../src/lib/profileValidation';

test('catalogue has unique IDs and cohort-specific options', () => {
  expect(new Set(academicPrograms.map(p => p.id)).size).toBe(academicPrograms.length);
  for (const cohort of ['K61', 'K62', 'K63', 'K64']) expect(academicPrograms.filter(p => p.cohorts.includes(cohort)).length).toBeGreaterThan(25);
  expect(academicPrograms.every(p => ['Tiêu chuẩn', 'CLC', 'CTTT'].includes(p.matchingProgram))).toBeTruthy();
  const standard = academicPrograms.find(p => p.cohorts.includes('K63') && p.majorName === 'Kinh tế quốc tế' && p.name === 'Chương trình Kinh tế quốc tế');
  expect(standard && resolveProgramType(standard)).toEqual({ programType: 'Tiêu chuẩn', source: 'DEFAULT_STANDARD' });
  expect(resolveProgramType({ name: 'Chương trình chất lượng cao Kinh tế quốc tế' })).toEqual({ programType: 'CLC', source: 'NAME_INFERRED' });
  expect(resolveProgramType({ name: 'Chương trình đào tạo theo mô hình tiên tiến' })).toEqual({ programType: 'CTTT', source: 'NAME_INFERRED' });
  expect(resolveProgramType({ name: 'Chương trình đào tạo (CT ĐHNNQT)' })).toEqual({ programType: 'CTTT', source: 'NAME_INFERRED' });
  expect(graduationYears('', new Date('2026-10-04T00:00:00Z'))).toEqual([2026, 2027, 2028, 2029, 2030, 2031, 2032]);
  expect(graduationYears('Học kỳ II năm học 2025 - 2026', new Date('2026-10-04T00:00:00Z'))[0]).toBe(2025);
});

test('missing profile cannot skip steps; explicit zero and no certificate can proceed', async ({ page }) => {
  await enterManualCourses(page);
  const next = page.getByRole('button', { name: /Tiếp tục khám phá trường/ });
  await expect(next).toBeDisabled();
  await expect(page.getByRole('button', { name: /Gợi ý trường/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: /So sánh & Xuất/ })).toBeDisabled();
  await fillProfile(page);
  await expect(next).toBeEnabled();
  await page.locator('#profile-gpa4').fill('');
  await expect(next).toBeDisabled();
  await page.locator('#profile-gpa4').fill('0');
  await expect(next).toBeEnabled();
  await page.locator('#profile-gpa4').fill('4.1');
  await expect(next).toBeDisabled();
  await page.locator('#profile-gpa4').fill('0');
  await next.click();
  await expect(page.getByPlaceholder('Tìm theo tên trường, quốc gia...')).toBeVisible();
  await expect(page.getByText('Chỉ hiển thị đủ điều kiện + đã xác minh')).toHaveCount(0);
});

test('conditional certificate fields and cohort changes invalidate completeness', async ({ page }) => {
  await enterManualCourses(page);
  await fillProfile(page);
  const next = page.getByRole('button', { name: /Tiếp tục khám phá trường/ });
  await page.locator('#profile-certificate').selectOption('HAS_CERTIFICATE');
  await expect(next).toBeDisabled();
  await page.locator('#profile-language').selectOption('English');
  await page.locator('#profile-test').fill('IELTS');
  await page.locator('#profile-score').fill('5');
  await page.locator('#profile-language-level').selectOption('UNKNOWN');
  await page.locator('#profile-language-validity').selectOption('UNKNOWN');
  await expect(next).toBeEnabled();
  await page.locator('#profile-language-validity').selectOption('VALID');
  await expect(next).toBeDisabled();
  await page.locator('#profile-language-expiry').fill('2020-01-01');
  await expect(next).toBeEnabled(); // Complete but expired: eligibility remains false.
  await page.locator('#profile-cohort').selectOption('K64');
  await expect(page.locator('#profile-program')).toHaveValue('');
  await expect(next).toBeDisabled();
  await page.getByRole('searchbox', { name: 'Tìm ngành', exact: true }).fill('luat');
  await page.locator('#profile-major').selectOption({ label: 'Luật' });
  await expect(page.locator('#profile-program')).toHaveValue('');
});

test('guest planner state is temporary and is not restored from local storage', async ({ page }) => {
  await enterManualCourses(page);
  await fillProfile(page);
  await page.reload();
  await expect(page.locator('#fileUploadInput')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Lưu nháp|Xóa draft/ })).toHaveCount(0);
});

test('mobile profile and university details remain usable without changing course selections', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterManualCourses(page);
  await fillProfile(page);
  await page.screenshot({ path: 'test-results/mobile-profile.png', fullPage: true });
  await page.getByRole('button', { name: /Tiếp tục khám phá trường/ }).click();
  await page.getByPlaceholder('Tìm theo tên trường, quốc gia...').fill('Millikin University');
  await page.getByRole('button', { name: 'Chọn & lập phương án' }).click();
  await expect(page.getByRole('region', { name: 'Thông tin trường đã chọn' })).toBeVisible();
  await page.getByRole('checkbox').first().check();
  await page.getByText('Xem thêm thông tin trường', { exact: true }).click();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
  await expect(page.getByText('Nguồn thông tin tuyển chọn', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/mobile-university.png', fullPage: true });
  await page.getByRole('button', { name: 'Lưu & xem so sánh' }).click();
  await expect(page.getByText('Chỉ tiêu', { exact: true })).toBeVisible();
  await expect(page.getByText('Yêu cầu đầu vào', { exact: true })).toBeVisible();
});
