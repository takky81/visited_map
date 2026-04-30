# アーキテクチャ設計

## 基本方針

- アプリのコアロジックはUIから完全に分離する
- コアロジックは純粋なTypeScriptで実装し、Vitestで単体テストする
- UIはReactコンポーネントで実装し、コアロジックを呼び出す
- E2Eテスト（Playwright）はUIの操作と表示を検証する

## フォルダ構成

```text
src/
  logic/
    storage.ts        ← localStorage の読み書き・初期データ生成
    storage.test.ts
    saveData.ts       ← SaveDataModel の操作（ユーザー・訪問状態のCRUD）
    saveData.test.ts
  models.ts           ← 型定義（SaveDataModel / AreaStatusModel / UserDataModel / MapDataModel）
  contexts/
    SaveDataContext.tsx ← SaveDataModel のグローバル状態管理
    PageContext.tsx     ← 画面遷移の状態管理
  pages/
    UserList/
      UserList.tsx    ← ユーザー管理画面
    VisitedMap/
      VisitedMap.tsx  ← 訪問マップ画面
  components/
    ModalDialog.tsx   ← 共通モーダルコンポーネント
  mapDatas/
    map-full.svg      ← デスクトップ用日本地図SVG
    map-mobile.svg    ← モバイル用日本地図SVG
  App.tsx
  main.tsx
e2e/
  user-list.test.ts   ← UserList画面のE2Eテスト
  visited-map.test.ts ← VisitedMap画面のE2Eテスト
docs/
  TDD.md              ← 開発手法
  ARCHITECTURE.md     ← このファイル
SPEC.md               ← アプリ仕様書
```

## ロジックとUIの分離

### ロジック層（src/logic/）

- 純粋なTypeScriptで実装する（Reactに依存しない）
- 状態を受け取り、新しい状態を返す純粋関数を基本とする
- 副作用（localStorage、タイマーなど）はロジック層に含めない（storage.ts を除く）
- Vitestで直接テストできること

例:

```typescript
// src/logic/saveData.ts
export function addUser(data: SaveDataModel, name: string): SaveDataModel { ... }
export function deleteAreaStatus(data: SaveDataModel, uuid: string): SaveDataModel { ... }
export function cycleAreaStatus(data: SaveDataModel, userUuid: string, areaId: string): SaveDataModel { ... }
```

### UI層（src/pages/ / src/components/）

- Reactコンポーネントで実装する
- ロジック層の関数を呼び出して状態を更新する
- 表示、アニメーション、ユーザー入力の処理を担当する
- アプリ全体の状態は Context（SaveDataContext / PageContext）で管理する

例:

```tsx
// src/pages/UserList/UserList.tsx
import { addUser, deleteUser } from '../../logic/saveData';
import { useSaveData } from '../../contexts/SaveDataContext';

export default function UserList() {
  const { saveData, setSaveData } = useSaveData();

  function handleAddUser() {
    setSaveData(addUser(saveData, `ユーザー${saveData.userDataModels.length + 1}`));
  }
  // ...
}
```

## 共通UIパターン

### レイアウト

- モバイルファースト設計（Tailwind CSSを使用）
- 768px 未満でモバイル用SVGに切り替え
- 各画面に「戻る」ナビゲーションを配置

### 色の方針

- UIは Tailwind のデフォルトカラーで統一
- 訪問状態の色はユーザー定義（`AreaStatusModel.areaStatusColor`）

## テスト戦略

### Vitest（単体テスト）

- `src/logic/` 配下のロジックをテストする
- テストファイルはロジックファイルの隣に配置する（例: `saveData.ts` の隣に `saveData.test.ts`）
- t_wada式TDDに従い、テストを先に書いてからロジックを実装する

### Playwright（E2Eテスト）

- `e2e/` 配下に配置する
- 画面遷移、ユーザー操作、表示の確認をテストする
- Desktop Chrome と Mobile Chrome の両方でテストする

## 状態管理

- `SaveDataModel` は `SaveDataContext` でグローバル管理し、変更時に localStorage へ書き込む
- 画面遷移（UserList ↔ VisitedMap）は `PageContext` で管理する
- ローカルUIの状態（選択中の行、モーダル開閉など）は各コンポーネントの `useState` で管理する
