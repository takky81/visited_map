import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

// ─── 初期表示 ─────────────────────────────────────────────────────────────────

test('ページを開くと訪問マップのタイトルが表示される', async ({ page }) => {
  await expect(page.getByRole('heading', { name: '訪問マップ' })).toBeVisible();
});

test('初期状態でユーザーがいない場合「ユーザーがいません」が表示される', async ({ page }) => {
  await expect(page.getByText('ユーザーがいません')).toBeVisible();
});

test('初期状態で訪問状態が3件表示される（通過・観光・居住）', async ({ page }) => {
  await expect(page.getByText('通過')).toBeVisible();
  await expect(page.getByText('観光')).toBeVisible();
  await expect(page.getByText('居住')).toBeVisible();
});

test('ユーザーが0人のとき「マップを開く」ボタンが無効になっている', async ({ page }) => {
  const button = page.getByRole('button', { name: /マップを開く/ });
  await expect(button).toBeDisabled();
});

// ─── ユーザー操作 ──────────────────────────────────────────────────────────────

test('追加ボタンでユーザーが追加される', async ({ page }) => {
  await page.getByRole('button', { name: '追加' }).first().click();
  await expect(page.getByText('ユーザー1')).toBeVisible();
});

test('ユーザーを追加するとマップを開くボタンが有効になる', async ({ page }) => {
  await page.getByRole('button', { name: '追加' }).first().click();
  const button = page.getByRole('button', { name: /マップを開く/ });
  await expect(button).toBeEnabled();
});

test('ユーザーを選択して編集ボタンでモーダルが開く', async ({ page }) => {
  await page.getByRole('button', { name: '追加' }).first().click();
  await page.getByText('ユーザー1').click();
  await page.getByRole('button', { name: '編集' }).first().click();
  await expect(page.getByRole('heading', { name: 'ユーザー編集' })).toBeVisible();
});

test('ユーザー編集モーダルで名前を変更して保存できる', async ({ page }) => {
  await page.getByRole('button', { name: '追加' }).first().click();
  await page.getByText('ユーザー1').click();
  await page.getByRole('button', { name: '編集' }).first().click();
  await page.getByLabel('名前').fill('田中太郎');
  await page.getByRole('button', { name: '保存' }).click();
  await expect(page.getByText('田中太郎')).toBeVisible();
});

test('ユーザーを選択して削除できる', async ({ page }) => {
  await page.getByRole('button', { name: '追加' }).first().click();
  await page.getByText('ユーザー1').click();
  await page.getByRole('button', { name: '削除' }).first().click();
  await expect(page.getByText('ユーザーがいません')).toBeVisible();
});

// ─── 訪問状態操作 ─────────────────────────────────────────────────────────────

test('訪問状態の追加モーダルが開く', async ({ page }) => {
  await page.getByRole('button', { name: '追加' }).nth(1).click();
  await expect(page.getByRole('heading', { name: '訪問状態追加' })).toBeVisible();
});

test('訪問状態を追加できる', async ({ page }) => {
  await page.getByRole('button', { name: '追加' }).nth(1).click();
  await page.getByLabel('名前').fill('宿泊');
  await page.getByRole('button', { name: '保存' }).click();
  await expect(page.getByText('宿泊')).toBeVisible();
});

test('訪問状態を選択して編集できる', async ({ page }) => {
  await page.getByText('通過').click();
  await page.getByRole('button', { name: '編集' }).nth(1).click();
  await expect(page.getByRole('heading', { name: '訪問状態編集' })).toBeVisible();
  await page.getByLabel('名前').fill('経由');
  await page.getByRole('button', { name: '保存' }).click();
  await expect(page.getByText('経由')).toBeVisible();
});

test('訪問状態を選択して削除できる', async ({ page }) => {
  await page.getByText('通過').click();
  await page.getByRole('button', { name: '削除' }).nth(1).click();
  await expect(page.getByText('通過')).not.toBeVisible();
});

test('訪問状態を1件選択したとき↑↓ボタンが操作できる', async ({ page }) => {
  await page.getByText('観光').click();
  const upBtn = page.getByRole('button', { name: '↑', exact: true });
  await expect(upBtn).toBeEnabled();
});

// ─── エクスポート / インポート ────────────────────────────────────────────────

test('エクスポートボタンが表示される', async ({ page }) => {
  await expect(page.getByRole('button', { name: /エクスポート/ })).toBeVisible();
});

test('インポートボタンが表示される', async ({ page }) => {
  await expect(page.getByRole('button', { name: /インポート/ })).toBeVisible();
});

// ─── 画面遷移 ─────────────────────────────────────────────────────────────────

test('ユーザーを追加してマップを開くと地図画面に遷移する', async ({ page }) => {
  await page.getByRole('button', { name: '追加' }).first().click();
  await page.getByRole('button', { name: /マップを開く/ }).click();
  await expect(page.getByRole('button', { name: /← 戻る/ })).toBeVisible();
});
