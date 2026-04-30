import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { SaveDataModel } from '../models';
import { loadSaveData, saveSaveData } from '../logic/storage';

interface SaveDataContextValue {
  saveData: SaveDataModel;
  setSaveData: React.Dispatch<React.SetStateAction<SaveDataModel>>;
}

const SaveDataContext = createContext<SaveDataContextValue>({
  saveData: { version: 0, areaStatusModels: [], userDataModels: [] },
  setSaveData: () => {},
});

export function SaveDataProvider({ children }: { children: React.ReactNode }) {
  const [saveData, setSaveData] = useState<SaveDataModel>(() => loadSaveData());
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveSaveData(saveData);
  }, [saveData]);

  return (
    <SaveDataContext.Provider value={{ saveData, setSaveData }}>
      {children}
    </SaveDataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSaveData() {
  return useContext(SaveDataContext);
}
