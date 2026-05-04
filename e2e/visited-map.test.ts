import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  // ユーザーを2人追加
  await page.getByRole('button', { name: 'ユーザーを追加' }).click();
  await page.getByRole('button', { name: 'ユーザーを追加' }).click();
});

// ─── 基本表示 ─────────────────────────────────────────────────────────────────

test('マップ画面にSVGが表示される', async ({ page }) => {
  await expect(page.locator('svg')).toBeVisible();
});

test('ユーザー選択セクションが表示される', async ({ page }) => {
  await expect(page.getByText('ユーザー', { exact: true })).toBeVisible();
});

test('訪問状態セクションが表示される', async ({ page }) => {
  await expect(page.getByText('訪問状態')).toBeVisible();
  await expect(page.getByText('通過')).toBeVisible();
  await expect(page.getByText('観光')).toBeVisible();
  await expect(page.getByText('居住')).toBeVisible();
});

test('ユーザー一覧がサイドバーに表示される', async ({ page }) => {
  await expect(page.getByText('ユーザー1')).toBeVisible();
  await expect(page.getByText('ユーザー2')).toBeVisible();
});

// ─── ユーザー選択 ─────────────────────────────────────────────────────────────

test('ユーザーをクリックすると選択状態になる', async ({ page }) => {
  await page.getByText('ユーザー1').click();
  const userItem = page.getByText('ユーザー1').locator('..');
  await expect(userItem).toHaveClass(/bg-indigo-600/);
});

test('選択中のユーザーを再クリックすると解除される', async ({ page }) => {
  await page.getByText('ユーザー1').click();
  await page.getByText('ユーザー1').click();
  const userItem = page.getByText('ユーザー1').locator('..');
  await expect(userItem).not.toHaveClass(/bg-indigo-600/);
});

test('2人選択すると比較モードバッジが表示される', async ({ page }) => {
  await page.getByText('ユーザー1').click();
  await page.getByText('ユーザー2').click();
  await expect(page.getByText('比較モード')).toBeVisible();
});

// ─── マップクリック ───────────────────────────────────────────────────────────

test('ユーザー選択後に都道府県クリックで訪問状態が変わる', async ({ page }) => {
  await page.getByText('ユーザー1').click();
  const initialFill = await page
    .locator('[data-code="27"]')
    .evaluate((el: SVGElement) => el.style.fill);
  await page.locator('[data-code="27"]').dispatchEvent('click');
  await page.waitForTimeout(100);
  const afterFill = await page
    .locator('[data-code="27"]')
    .evaluate((el: SVGElement) => el.style.fill);
  expect(afterFill).not.toBe(initialFill);
});

test('ユーザー未選択時にクリックしても状態が変わらない', async ({ page }) => {
  const initialFill = await page
    .locator('[data-code="27"]')
    .evaluate((el: SVGElement) => el.style.fill);
  await page.locator('[data-code="27"]').dispatchEvent('click');
  await page.waitForTimeout(100);
  const afterFill = await page
    .locator('[data-code="27"]')
    .evaluate((el: SVGElement) => el.style.fill);
  expect(afterFill).toBe(initialFill);
});

test('ユーザー未選択時に都道府県クリックでエラーダイアログが表示される', async ({ page }) => {
  await page.locator('[data-code="27"]').dispatchEvent('click');
  await expect(page.getByText('ユーザーが選択されていません')).toBeVisible();
});

test('エラーダイアログの閉じるボタンでダイアログが消える', async ({ page }) => {
  await page.locator('[data-code="27"]').dispatchEvent('click');
  await page.getByRole('button', { name: '閉じる' }).click();
  await expect(page.getByText('ユーザーが選択されていません')).not.toBeVisible();
});
