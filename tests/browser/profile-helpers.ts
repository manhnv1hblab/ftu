import { Page } from '@playwright/test';
import catalogue from '../../data/ftu_programs.json';

export const standardProgram = catalogue.programs.find(p => p.cohorts.includes('K62') && p.majorName === 'Kinh tế' && p.name === 'Chương trình tiêu chuẩn Kinh tế đối ngoại')!;
export const clcProgram = catalogue.programs.find(p => p.cohorts.includes('K62') && p.majorName === 'Kinh tế' && p.matchingProgram === 'CLC')!;

export async function fillProfile(page: Page) {
  await page.locator('#profile-cohort').selectOption('K62');
  await page.locator('#profile-major').selectOption(standardProgram.majorId);
  await page.locator('#profile-program').selectOption(standardProgram.id);
  await page.locator('#profile-graduation').selectOption({ index: 1 });
  await page.getByRole('combobox', { name: 'Học kỳ dự kiến tốt nghiệp', exact: true }).selectOption('II');
  await page.locator('#profile-gpa4').fill('2');
  await page.locator('#profile-gpa10').fill('5');
  await page.locator('#profile-semesters').fill('0');
  for (const id of ['previous-exchange', 'final-semester', 'midterm-internship', 'exemplary-award']) await page.locator(`#profile-${id}`).selectOption('false');
  await page.locator('#profile-certificate').selectOption('NO_CERTIFICATE');
}

export async function enterManualCourses(page: Page) {
  await page.goto('/planner');
  await page.getByRole('button', { name: 'Nhập mã môn' }).click();
  await page.getByPlaceholder(/VD: KTE402/).fill('TCH321, TIN313, TCH412');
  await page.getByRole('button', { name: /Xác nhận & Tiếp tục/ }).click();
}
