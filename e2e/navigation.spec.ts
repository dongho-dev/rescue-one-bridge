import { test, expect } from '@playwright/test';

test.describe('Navigation - All Pages', () => {
  test('should access dashboard page', async ({ page }) => {
    await page.goto('/');
    // Default page is dashboard for hospital_staff
    await expect(page.getByText('병원 응급실 대시보드')).toBeVisible();
    await expect(page.getByText('가용 병상')).toBeVisible();
  });

  test('should access patient management page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('환자 관리').click();
    // PatientDetails component should render
    await expect(page.getByText(/환자|Patient/i)).toBeVisible({ timeout: 5000 });
  });

  test('should access bed management page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('병상 관리').click();
    await expect(page.getByText(/응급실 병상 현황을 실시간으로 관리하고/)).toBeVisible({ timeout: 5000 });
  });

  test('should access staff management page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('직원 관리').click();
    // StaffManagement component should render with staff-related content
    await expect(page.getByText(/직원|근무|스케줄|Staff/i)).toBeVisible({ timeout: 5000 });
  });

  test('should access equipment status page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('장비 현황').click();
    // EquipmentStatus component should render
    await expect(page.getByText(/장비|Equipment|의료/i)).toBeVisible({ timeout: 5000 });
  });

  test('should access patient request page', async ({ page }) => {
    await page.goto('/');
    await page.getByText('구급대원 요청').click();
    await expect(page.getByText('구급대원 환자 요청')).toBeVisible({ timeout: 5000 });
  });
});
