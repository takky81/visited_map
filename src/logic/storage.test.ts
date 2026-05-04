import { beforeEach, describe, expect, test } from 'vitest';
import { loadSaveData, saveSaveData, exportSaveData, importSaveData } from './storage';
import { createDefaultSaveData } from './saveData';
import { SAVE_DATA_VERSION } from '../models';

beforeEach(() => {
  localStorage.clear();
});

// ─── loadSaveData ─────────────────────────────────────────────────────────────

describe('loadSaveData', () => {
  test('localStorage が空のときデフォルト初期データを返す', () => {
    const data = loadSaveData();
    expect(data.version).toBe(SAVE_DATA_VERSION);
    expect(data.areaStatusModels).toHaveLength(4);
    expect(data.userDataModels).toHaveLength(0);
  });

  test('保存したデータを復元できる', () => {
    const original = createDefaultSaveData();
    saveSaveData(original);
    const loaded = loadSaveData();
    expect(loaded.version).toBe(original.version);
    expect(loaded.areaStatusModels).toHaveLength(original.areaStatusModels.length);
    expect(loaded.userDataModels).toHaveLength(original.userDataModels.length);
  });

  test('localStorage の JSON が壊れている場合はデフォルト初期データを返す', () => {
    localStorage.setItem('saveData', 'not-valid-json');
    const data = loadSaveData();
    expect(data.version).toBe(SAVE_DATA_VERSION);
  });
});

// ─── saveSaveData ─────────────────────────────────────────────────────────────

describe('saveSaveData', () => {
  test('localStorage に保存されること', () => {
    const data = createDefaultSaveData();
    saveSaveData(data);
    expect(localStorage.getItem('saveData')).not.toBeNull();
  });
});

// ─── exportSaveData ───────────────────────────────────────────────────────────

describe('exportSaveData', () => {
  test('JSON 文字列を返す', () => {
    const data = createDefaultSaveData();
    const json = exportSaveData(data);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  test('エクスポートした JSON にバージョンが含まれる', () => {
    const data = createDefaultSaveData();
    const json = exportSaveData(data);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(SAVE_DATA_VERSION);
  });
});

// ─── importSaveData ───────────────────────────────────────────────────────────

describe('importSaveData', () => {
  test('正常な JSON をインポートできる', () => {
    const data = createDefaultSaveData();
    const json = exportSaveData(data);
    const result = importSaveData(json);
    expect(result.ok).toBe(true);
  });

  test('不正な JSON はエラーを返す', () => {
    const result = importSaveData('not-valid-json');
    expect(result.ok).toBe(false);
  });

  test('バージョンが一致しない場合はエラーを返す', () => {
    const data = createDefaultSaveData();
    const wrongVersion = { ...data, version: 999 };
    const result = importSaveData(JSON.stringify(wrongVersion));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('バージョン');
    }
  });

  test('areaStatusModels が配列でない場合はエラーを返す', () => {
    const data = createDefaultSaveData();
    const invalid = { ...data, areaStatusModels: 'invalid' };
    const result = importSaveData(JSON.stringify(invalid));
    expect(result.ok).toBe(false);
  });

  test('userDataModels が配列でない場合はエラーを返す', () => {
    const data = createDefaultSaveData();
    const invalid = { ...data, userDataModels: null };
    const result = importSaveData(JSON.stringify(invalid));
    expect(result.ok).toBe(false);
  });
});
