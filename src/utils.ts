import type { SaveDataModel } from './models';

const SAVE_DATA_KEY = 'saveData' as const;

export const initalSaveData: SaveDataModel = {
  areaStatusModels: [],
  userDataModels: [],
};

export function load() {
  const serializedSaveData = localStorage.getItem(SAVE_DATA_KEY);
  if (serializedSaveData) {
    const saveData = JSON.parse(serializedSaveData) as SaveDataModel;
    if (saveData) {
      return saveData;
    }
  }

  return initalSaveData;
}

export function save(saveData: SaveDataModel) {
  const serializedSaveData = JSON.stringify(saveData);
  localStorage.setItem(SAVE_DATA_KEY, serializedSaveData);
}
