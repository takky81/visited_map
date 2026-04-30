import type { SaveDataModel } from '../models';
import { SAVE_DATA_VERSION } from '../models';
import { createDefaultSaveData } from './saveData';

const STORAGE_KEY = 'saveData';

export function loadSaveData(): SaveDataModel {
  const serialized = localStorage.getItem(STORAGE_KEY);
  if (!serialized) return createDefaultSaveData();
  try {
    return JSON.parse(serialized) as SaveDataModel;
  } catch {
    return createDefaultSaveData();
  }
}

export function saveSaveData(data: SaveDataModel): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportSaveData(data: SaveDataModel): string {
  return JSON.stringify(data, null, 2);
}

export type ImportResult = { ok: true; data: SaveDataModel } | { ok: false; error: string };

export function importSaveData(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'JSONの形式が不正です。' };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'データの構造が不正です。' };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj['version'] !== SAVE_DATA_VERSION) {
    return {
      ok: false,
      error: `バージョンが一致しません（期待: ${SAVE_DATA_VERSION}、実際: ${obj['version']}）`,
    };
  }

  if (!Array.isArray(obj['areaStatusModels']) || !Array.isArray(obj['userDataModels'])) {
    return { ok: false, error: 'データの構造が不正です。' };
  }

  return { ok: true, data: parsed as SaveDataModel };
}
