import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  // ユーザーを2人追加してマップ画面へ
  await page.getByRole('button', { name: '追加' }).first().click();
  await page.getByRole('button', { name: '追加' }).first().click();
  await page.getByRole('button', { name: /マップを開く/ }).click();
});

// ─── 基本表示 ─────────────────────────────────────────────────────────────────

test('マップ画面にSVGが表示される', async ({ page }) => {
  await expect(page.locator('svg')).toBeVisible();
});

test('戻るボタンが表示される', async ({ page }) => {
  await expect(page.getByRole('button', { name: /← 戻る/ })).toBeVisible();
});

test('ユーザー選択セクションが表示される', async ({ page }) => {
  await expect(page.getByText('ユーザー選択')).toBeVisible();
});

test('凡例セクションが表示される', async ({ page }) => {
  await expect(page.getByText('凡例')).toBeVisible();
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

// ─── 画面遷移 ─────────────────────────────────────────────────────────────────

test('戻るボタンでユーザー管理画面に戻れる', async ({ page }) => {
  await page.getByRole('button', { name: /← 戻る/ }).click();
  await expect(page.getByRole('heading', { name: '訪問マップ' })).toBeVisible();
});
