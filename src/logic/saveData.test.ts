import { describe, expect, test } from 'vitest';
import {
  createDefaultSaveData,
  addUser,
  updateUser,
  deleteUsers,
  addAreaStatus,
  updateAreaStatus,
  deleteAreaStatuses,
  moveAreaStatusUp,
  moveAreaStatusDown,
  getAreaStatusUuid,
  cycleAreaStatus,
} from './saveData';
import { SAVE_DATA_VERSION } from '../models';

// ─── createDefaultSaveData ───────────────────────────────────────────────────

describe('createDefaultSaveData', () => {
  test('バージョンが1である', () => {
    const data = createDefaultSaveData();
    expect(data.version).toBe(SAVE_DATA_VERSION);
  });

  test('初期データには訪問状態が4件ある', () => {
    const data = createDefaultSaveData();
    expect(data.areaStatusModels).toHaveLength(4);
  });

  test('初期訪問状態の名前が通過・観光・宿泊・居住の順である', () => {
    const data = createDefaultSaveData();
    expect(data.areaStatusModels[0].areaStatusName).toBe('通過');
    expect(data.areaStatusModels[1].areaStatusName).toBe('観光');
    expect(data.areaStatusModels[2].areaStatusName).toBe('宿泊');
    expect(data.areaStatusModels[3].areaStatusName).toBe('居住');
  });

  test('初期訪問状態の色が仕様通りである', () => {
    const data = createDefaultSaveData();
    expect(data.areaStatusModels[0].areaStatusColor).toBe('#FFD54F');
    expect(data.areaStatusModels[1].areaStatusColor).toBe('#81C784');
    expect(data.areaStatusModels[2].areaStatusColor).toBe('#FFB74D');
    expect(data.areaStatusModels[3].areaStatusColor).toBe('#64B5F6');
  });

  test('初期ユーザーが0件である', () => {
    const data = createDefaultSaveData();
    expect(data.userDataModels).toHaveLength(0);
  });
});

// ─── addUser ─────────────────────────────────────────────────────────────────

describe('addUser', () => {
  test('ユーザーを追加すると1件増える', () => {
    const data = createDefaultSaveData();
    const result = addUser(data);
    expect(result.userDataModels).toHaveLength(1);
  });

  test('追加されたユーザーの名前は「ユーザー1」である（ユーザーが0人のとき）', () => {
    const data = createDefaultSaveData();
    const result = addUser(data);
    expect(result.userDataModels[0].userName).toBe('ユーザー1');
  });

  test('追加されたユーザーの名前は「ユーザーN」である（N = 現在のユーザー数 + 1）', () => {
    const data = createDefaultSaveData();
    const after1 = addUser(data);
    const after2 = addUser(after1);
    expect(after2.userDataModels[1].userName).toBe('ユーザー2');
  });

  test('追加されたユーザーの mapDataModels は空配列である', () => {
    const data = createDefaultSaveData();
    const result = addUser(data);
    expect(result.userDataModels[0].mapDataModels).toEqual([]);
  });

  test('元のデータを変更しない（イミュータブル）', () => {
    const data = createDefaultSaveData();
    const result = addUser(data);
    expect(data.userDataModels).toHaveLength(0);
    expect(result).not.toBe(data);
  });
});

// ─── updateUser ──────────────────────────────────────────────────────────────

describe('updateUser', () => {
  test('指定したユーザーの名前が更新される', () => {
    const data = createDefaultSaveData();
    const withUser = addUser(data);
    const userUuid = withUser.userDataModels[0].userUuid;
    const result = updateUser(withUser, userUuid, '田中太郎');
    expect(result.userDataModels[0].userName).toBe('田中太郎');
  });

  test('他のユーザーに影響しない', () => {
    const data = createDefaultSaveData();
    const with2 = addUser(addUser(data));
    const uuid1 = with2.userDataModels[0].userUuid;
    const result = updateUser(with2, uuid1, '変更後');
    expect(result.userDataModels[1].userName).toBe('ユーザー2');
  });
});

// ─── deleteUsers ─────────────────────────────────────────────────────────────

describe('deleteUsers', () => {
  test('指定したユーザーが削除される', () => {
    const data = createDefaultSaveData();
    const withUser = addUser(data);
    const userUuid = withUser.userDataModels[0].userUuid;
    const result = deleteUsers(withUser, new Set([userUuid]));
    expect(result.userDataModels).toHaveLength(0);
  });

  test('複数のユーザーを一括削除できる', () => {
    const data = createDefaultSaveData();
    const with2 = addUser(addUser(data));
    const uuids = new Set(with2.userDataModels.map((u) => u.userUuid));
    const result = deleteUsers(with2, uuids);
    expect(result.userDataModels).toHaveLength(0);
  });

  test('削除対象でないユーザーは残る', () => {
    const data = createDefaultSaveData();
    const with2 = addUser(addUser(data));
    const uuid1 = with2.userDataModels[0].userUuid;
    const result = deleteUsers(with2, new Set([uuid1]));
    expect(result.userDataModels).toHaveLength(1);
    expect(result.userDataModels[0].userUuid).toBe(with2.userDataModels[1].userUuid);
  });
});

// ─── addAreaStatus ───────────────────────────────────────────────────────────

describe('addAreaStatus', () => {
  test('訪問状態を追加すると配列末尾に追加される', () => {
    const data = createDefaultSaveData();
    const result = addAreaStatus(data, { name: '滞在', color: '#FF8A65' });
    expect(result.areaStatusModels).toHaveLength(5);
    expect(result.areaStatusModels[4].areaStatusName).toBe('滞在');
    expect(result.areaStatusModels[4].areaStatusColor).toBe('#FF8A65');
  });

  test('追加された訪問状態には UUID が付与される', () => {
    const data = createDefaultSaveData();
    const result = addAreaStatus(data, { name: '滞在', color: '#FF8A65' });
    expect(result.areaStatusModels[4].areaStatusUuid).toBeTruthy();
  });
});

// ─── updateAreaStatus ────────────────────────────────────────────────────────

describe('updateAreaStatus', () => {
  test('指定した訪問状態の名前と色が更新される', () => {
    const data = createDefaultSaveData();
    const uuid = data.areaStatusModels[0].areaStatusUuid;
    const result = updateAreaStatus(data, uuid, { name: '経由', color: '#FFCC00' });
    expect(result.areaStatusModels[0].areaStatusName).toBe('経由');
    expect(result.areaStatusModels[0].areaStatusColor).toBe('#FFCC00');
  });

  test('他の訪問状態に影響しない', () => {
    const data = createDefaultSaveData();
    const uuid = data.areaStatusModels[0].areaStatusUuid;
    const result = updateAreaStatus(data, uuid, { name: '経由', color: '#FFCC00' });
    expect(result.areaStatusModels[1].areaStatusName).toBe('観光');
  });
});

// ─── deleteAreaStatuses ──────────────────────────────────────────────────────

describe('deleteAreaStatuses', () => {
  test('指定した訪問状態が削除される', () => {
    const data = createDefaultSaveData();
    const uuid = data.areaStatusModels[0].areaStatusUuid;
    const result = deleteAreaStatuses(data, new Set([uuid]));
    expect(result.areaStatusModels).toHaveLength(3);
    expect(result.areaStatusModels.find((s) => s.areaStatusUuid === uuid)).toBeUndefined();
  });

  test('削除した訪問状態が設定されていたユーザーの記録も削除される', () => {
    const data = createDefaultSaveData();
    const withUser = addUser(data);
    const userUuid = withUser.userDataModels[0].userUuid;
    const statusUuid = withUser.areaStatusModels[0].areaStatusUuid;
    const withRecord = cycleAreaStatus(withUser, userUuid, '13');
    expect(getAreaStatusUuid(withRecord, userUuid, '13')).toBe(statusUuid);
    const result = deleteAreaStatuses(withRecord, new Set([statusUuid]));
    expect(getAreaStatusUuid(result, userUuid, '13')).toBeUndefined();
  });

  test('複数の訪問状態を一括削除できる', () => {
    const data = createDefaultSaveData();
    const uuids = new Set([
      data.areaStatusModels[0].areaStatusUuid,
      data.areaStatusModels[1].areaStatusUuid,
    ]);
    const result = deleteAreaStatuses(data, uuids);
    expect(result.areaStatusModels).toHaveLength(2);
  });
});

// ─── moveAreaStatusUp / Down ─────────────────────────────────────────────────

describe('moveAreaStatusUp', () => {
  test('2番目の訪問状態を上に移動すると1番目になる', () => {
    const data = createDefaultSaveData();
    const uuid = data.areaStatusModels[1].areaStatusUuid;
    const result = moveAreaStatusUp(data, uuid);
    expect(result.areaStatusModels[0].areaStatusUuid).toBe(uuid);
  });

  test('先頭の訪問状態を上に移動しても順序が変わらない', () => {
    const data = createDefaultSaveData();
    const uuid = data.areaStatusModels[0].areaStatusUuid;
    const result = moveAreaStatusUp(data, uuid);
    expect(result.areaStatusModels[0].areaStatusUuid).toBe(uuid);
  });
});

describe('moveAreaStatusDown', () => {
  test('1番目の訪問状態を下に移動すると2番目になる', () => {
    const data = createDefaultSaveData();
    const uuid = data.areaStatusModels[0].areaStatusUuid;
    const result = moveAreaStatusDown(data, uuid);
    expect(result.areaStatusModels[1].areaStatusUuid).toBe(uuid);
  });

  test('末尾の訪問状態を下に移動しても順序が変わらない', () => {
    const data = createDefaultSaveData();
    const last = data.areaStatusModels[data.areaStatusModels.length - 1];
    const result = moveAreaStatusDown(data, last.areaStatusUuid);
    expect(result.areaStatusModels[result.areaStatusModels.length - 1].areaStatusUuid).toBe(
      last.areaStatusUuid,
    );
  });
});

// ─── getAreaStatusUuid ───────────────────────────────────────────────────────

describe('getAreaStatusUuid', () => {
  test('訪問状態が設定されていない都道府県は undefined を返す', () => {
    const data = createDefaultSaveData();
    const withUser = addUser(data);
    const userUuid = withUser.userDataModels[0].userUuid;
    expect(getAreaStatusUuid(withUser, userUuid, '13')).toBeUndefined();
  });

  test('訪問状態が設定されている都道府県の UUID を返す', () => {
    const data = createDefaultSaveData();
    const withUser = addUser(data);
    const userUuid = withUser.userDataModels[0].userUuid;
    const after = cycleAreaStatus(withUser, userUuid, '13');
    const statusUuid = data.areaStatusModels[0].areaStatusUuid;
    expect(getAreaStatusUuid(after, userUuid, '13')).toBe(statusUuid);
  });
});

// ─── cycleAreaStatus ─────────────────────────────────────────────────────────

describe('cycleAreaStatus', () => {
  test('未設定の都道府県をクリックすると最初の訪問状態が設定される', () => {
    const data = createDefaultSaveData();
    const withUser = addUser(data);
    const userUuid = withUser.userDataModels[0].userUuid;
    const result = cycleAreaStatus(withUser, userUuid, '13');
    expect(getAreaStatusUuid(result, userUuid, '13')).toBe(data.areaStatusModels[0].areaStatusUuid);
  });

  test('最初の訪問状態から次の訪問状態にサイクルする', () => {
    const data = createDefaultSaveData();
    const withUser = addUser(data);
    const userUuid = withUser.userDataModels[0].userUuid;
    const after1 = cycleAreaStatus(withUser, userUuid, '13');
    const after2 = cycleAreaStatus(after1, userUuid, '13');
    expect(getAreaStatusUuid(after2, userUuid, '13')).toBe(data.areaStatusModels[1].areaStatusUuid);
  });

  test('最後の訪問状態から未設定に戻る', () => {
    const data = createDefaultSaveData();
    const withUser = addUser(data);
    const userUuid = withUser.userDataModels[0].userUuid;
    let current = withUser;
    for (let i = 0; i <= data.areaStatusModels.length; i++) {
      current = cycleAreaStatus(current, userUuid, '13');
    }
    expect(getAreaStatusUuid(current, userUuid, '13')).toBeUndefined();
  });

  test('訪問状態が0件の場合はクリックしても未設定のまま', () => {
    const data = createDefaultSaveData();
    const empty = { ...data, areaStatusModels: [] };
    const withUser = addUser(empty);
    const userUuid = withUser.userDataModels[0].userUuid;
    const result = cycleAreaStatus(withUser, userUuid, '13');
    expect(getAreaStatusUuid(result, userUuid, '13')).toBeUndefined();
  });

  test('他のユーザーの記録に影響しない', () => {
    const data = createDefaultSaveData();
    const with2 = addUser(addUser(data));
    const uuid1 = with2.userDataModels[0].userUuid;
    const uuid2 = with2.userDataModels[1].userUuid;
    const result = cycleAreaStatus(with2, uuid1, '13');
    expect(getAreaStatusUuid(result, uuid2, '13')).toBeUndefined();
  });

  test('他の都道府県の記録に影響しない', () => {
    const data = createDefaultSaveData();
    const withUser = addUser(data);
    const userUuid = withUser.userDataModels[0].userUuid;
    const after = cycleAreaStatus(withUser, userUuid, '13');
    expect(getAreaStatusUuid(after, userUuid, '01')).toBeUndefined();
  });
});
