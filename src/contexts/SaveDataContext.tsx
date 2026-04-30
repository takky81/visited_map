import { createContext } from 'react';
import { type SaveDataModel } from '../models';
import { initalSaveData } from '../utils';

export const SaveDataContext = createContext<{
  saveData: SaveDataModel;
  setSaveData: React.Dispatch<React.SetStateAction<SaveDataModel>>;
}>({
  saveData: initalSaveData,
  setSaveData: () => {},
});
