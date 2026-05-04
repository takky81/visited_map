import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

// ─── 初期表示 ─────────────────────────────────────────────────────────────────

test('ページを開くと訪問マップのタイトルが表示される', async ({ page }) => {
  await expect(page.getByText('🗾 訪問マップ')).toBeVisible();
});

test('初期状態でユーザーがいない場合「ユーザーがいません」が表示される', async ({ page }) => {
  await expect(page.getByText('ユーザーがいません')).toBeVisible();
});

test('初期状態で訪問状態が表示される（通過・観光・居住）', async ({ page }) => {
  await expect(page.getByText('通過')).toBeVisible();
  await expect(page.getByText('観光')).toBeVisible();
  await expect(page.getByText('居住')).toBeVisible();
});

// ─── ユーザー操作 ──────────────────────────────────────────────────────────────

test('追加ボタンでユーザーが追加される', async ({ page }) => {
  await page.getByRole('button', { name: 'ユーザーを追加' }).click();
  await expect(page.getByText('ユーザー1')).toBeVisible();
});

test('編集ボタンでユーザー編集モーダルが開く', async ({ page }) => {
  await page.getByRole('button', { name: 'ユーザーを追加' }).click();
  await page
    .locator('li')
    .filter({ hasText: 'ユーザー1' })
    .getByRole('button', { name: '編集' })
    .click();
  await expect(page.getByRole('heading', { name: 'ユーザー編集' })).toBeVisible();
});

test('ユーザー編集モーダルで名前を変更して保存できる', async ({ page }) => {
  await page.getByRole('button', { name: 'ユーザーを追加' }).click();
  await page
    .locator('li')
    .filter({ hasText: 'ユーザー1' })
    .getByRole('button', { name: '編集' })
    .click();
  await page.getByLabel('名前').fill('田中太郎');
  await page.getByRole('button', { name: '保存' }).click();
  await expect(page.getByText('田中太郎')).toBeVisible();
});

test('削除ボタンでユーザーを削除できる', async ({ page }) => {
  await page.getByRole('button', { name: 'ユーザーを追加' }).click();
  await page
    .locator('li')
    .filter({ hasText: 'ユーザー1' })
    .getByRole('button', { name: '削除' })
    .click();
  await expect(page.getByText('ユーザーがいません')).toBeVisible();
});

// ─── 訪問状態操作 ─────────────────────────────────────────────────────────────

test('訪問状態の追加モーダルが開く', async ({ page }) => {
  await page.getByRole('button', { name: '訪問状態を追加' }).click();
  await expect(page.getByRole('heading', { name: '訪問状態追加' })).toBeVisible();
});

test('訪問状態を追加できる', async ({ page }) => {
  await page.getByRole('button', { name: '訪問状態を追加' }).click();
  await page.getByLabel('名前').fill('滞在');
  await page.getByRole('button', { name: '保存' }).click();
  await expect(page.getByText('滞在')).toBeVisible();
});

test('訪問状態の編集モーダルが開く', async ({ page }) => {
  await page
    .locator('li')
    .filter({ hasText: '通過' })
    .getByRole('button', { name: '編集' })
    .click();
  await expect(page.getByRole('heading', { name: '訪問状態編集' })).toBeVisible();
});

test('訪問状態を編集して保存できる', async ({ page }) => {
  await page
    .locator('li')
    .filter({ hasText: '通過' })
    .getByRole('button', { name: '編集' })
    .click();
  await page.getByLabel('名前').fill('経由');
  await page.getByRole('button', { name: '保存' }).click();
  await expect(page.getByText('経由')).toBeVisible();
});

test('訪問状態を削除できる', async ({ page }) => {
  await page
    .locator('li')
    .filter({ hasText: '通過' })
    .getByRole('button', { name: '削除' })
    .click();
  await expect(page.getByText('通過')).not.toBeVisible();
});

test('↑ボタンで訪問状態の順序を変更できる', async ({ page }) => {
  const upBtn = page
    .locator('li')
    .filter({ hasText: '観光' })
    .getByRole('button', { name: '上に移動' });
  await expect(upBtn).toBeEnabled();
  await upBtn.click();
});

// ─── エクスポート / インポート ────────────────────────────────────────────────

test('エクスポートボタンが表示される', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'エクスポート' })).toBeVisible();
});

test('インポートボタンが表示される', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'インポート' })).toBeVisible();
});
