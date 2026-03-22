import { test, expect } from '@playwright/test';

test.describe('Critical Path - Emergency Request Flow', () => {
  test('should create emergency request and show matching toast', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('데모 모드')).toBeVisible();

    // Navigate to patient request page
    await page.getByText('구급대원 요청').click();
    await expect(page.getByText('구급대원 환자 요청')).toBeVisible();

    // Click the emergency request button (top one-tap button)
    await page.getByRole('button', { name: /긴급 요청.*환자 정보 없이/ }).click();

    // Verify matching toast appears
    await expect(page.getByText(/매칭되었습니다/)).toBeVisible({ timeout: 5000 });
  });

  test('should create new patient request with form input', async ({ page }) => {
    await page.goto('/');
    await page.getByText('구급대원 요청').click();
    await expect(page.getByText('구급대원 환자 요청')).toBeVisible();

    // Open new patient form
    await page.getByRole('button', { name: '새 환자 등록' }).click();
    await expect(page.getByText('새 환자 정보 입력')).toBeVisible();

    // Fill in required fields
    await page.getByLabel('환자명 *').fill('테스트환자');
    await page.getByLabel('나이 *').fill('45');

    // Select severity
    await page.locator('text=중증도 *').locator('..').getByRole('combobox').click();
    await page.getByRole('option', { name: '응급' }).click();

    // Fill condition
    await page.getByLabel('주요 증상 *').fill('두통');

    // Submit via emergency request button in the request section
    await page.getByRole('button', { name: /응급 요청.*위급/ }).click();

    // Verify matching toast
    await expect(page.getByText(/매칭되었습니다/)).toBeVisible({ timeout: 5000 });
  });

  test('should switch demo role between hospital staff and paramedic', async ({ page }) => {
    await page.goto('/');

    // Initially hospital_staff — should see hospital dashboard
    await expect(page.getByText('병원 응급실 대시보드')).toBeVisible({ timeout: 5000 });

    // Click the role switcher in the demo banner
    await page.locator('button', { hasText: /전환/ }).click();
    await page.waitForTimeout(1000);

    // After switching to paramedic, should see paramedic dashboard
    await expect(page.getByText('구급대원 대시보드')).toBeVisible({ timeout: 15000 });

    // Switch back to hospital_staff
    await page.locator('button', { hasText: /전환/ }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText('병원 응급실 대시보드')).toBeVisible({ timeout: 15000 });
  });

  test('should reflect created request in hospital dashboard', async ({ page }) => {
    await page.goto('/');

    // Navigate to request page and create a request
    await page.getByText('구급대원 요청').click();
    await page.getByRole('button', { name: /긴급 요청.*환자 정보 없이/ }).click();
    await expect(page.getByText(/매칭되었습니다/)).toBeVisible({ timeout: 5000 });

    // Go back to dashboard
    await page.getByText('대시보드').first().click();

    // The dashboard should show the request
    await expect(page.getByText('들어오는 요청')).toBeVisible({ timeout: 5000 });
  });
});
