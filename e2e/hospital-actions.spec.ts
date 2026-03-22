import { test, expect } from '@playwright/test';

test.describe('Hospital Dashboard Actions', () => {
  test('should accept an incoming request', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('병원 응급실 대시보드')).toBeVisible();

    // Demo data should populate incoming requests table
    await expect(page.getByText('들어오는 요청')).toBeVisible();

    // Click the accept button (check icon) on the first request row
    const acceptButton = page.getByRole('button', { name: '수락' }).first();
    await acceptButton.click();

    // Verify acceptance toast
    await expect(page.getByText(/수락했습니다/)).toBeVisible({ timeout: 5000 });
  });

  test('should reject an incoming request', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('병원 응급실 대시보드')).toBeVisible();
    await expect(page.getByText('들어오는 요청')).toBeVisible();

    // Click the reject button (X icon) on the first request row
    const rejectButton = page.getByRole('button', { name: '거절' }).first();
    await rejectButton.click();

    // Verify rejection toast
    await expect(page.getByText(/거절|재매칭|다른 병원/)).toBeVisible({ timeout: 5000 });
  });

  test('should show accepting status toggle with AlertDialog confirmation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('병원 응급실 대시보드')).toBeVisible();

    // The accepting badge should show "환자수용중"
    await expect(page.getByText('환자수용중')).toBeVisible();

    // Click the switch to toggle accepting status
    await page.getByRole('switch', { name: '환자 수용 상태 전환' }).click();

    // AlertDialog should appear
    await expect(page.getByText('수용 상태 변경 확인')).toBeVisible();
    await expect(page.getByText(/수용을 중단하시겠습니까/)).toBeVisible();

    // Confirm the change
    await page.getByRole('button', { name: '확인' }).click();

    // Badge should update to "수용중단"
    await expect(page.getByText('수용중단')).toBeVisible({ timeout: 5000 });
  });
});
