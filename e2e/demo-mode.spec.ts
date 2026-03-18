import { test, expect } from '@playwright/test';

test.describe('Demo Mode - Hospital Dashboard', () => {
  test('should show demo banner and dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('데모 모드로 실행 중입니다')).toBeVisible();
    await expect(page.getByText('병원 응급실 대시보드')).toBeVisible();
  });

  test('should display KPI cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('가용 병상')).toBeVisible();
    await expect(page.getByText('ER 대기열')).toBeVisible();
    await expect(page.getByText('평균 대기시간')).toBeVisible();
    await expect(page.getByText('오늘 처리')).toBeVisible();
  });

  test('should navigate to bed management', async ({ page }) => {
    await page.goto('/');
    await page.getByText('병상 관리').click();
    await expect(page.getByText('응급실 병상 현황을 실시간으로 관리하고')).toBeVisible();
  });

  test('should navigate to patient request page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('구급대원 요청').click();
    await expect(page.getByText('구급대원 환자 요청')).toBeVisible();
  });
});

test.describe('Demo Mode - Patient Request', () => {
  test('should show quick patient list', async ({ page }) => {
    await page.goto('/');
    await page.getByText('구급대원 요청').click();
    await expect(page.getByText('빠른 환자 선택')).toBeVisible();
    await expect(page.getByText('김철수')).toBeVisible();
  });

  test('should select a patient and show info', async ({ page }) => {
    await page.goto('/');
    await page.getByText('구급대원 요청').click();
    await page.getByText('김철수').click();
    await expect(page.getByText('선택된 환자 정보')).toBeVisible();
  });
});

test.describe('Demo Mode - Theme', () => {
  test('should toggle theme', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('테마 변경').click();
    await page.getByText('어둡게').click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
