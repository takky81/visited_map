import { useEffect, useState } from 'react';

import UserList from './pages/UserList/UserList';
import VisitedMap from './pages/VisitedMap/VisitedMap';
import Page from './enums/Page';
import { type SaveDataModel } from './models';
import { SaveDataContext } from './contexts/SaveDataContext';
import { PageContext } from './contexts/PageContext';
import './App.css';
import { initalSaveData, load } from './utils';

function App() {
  const [page, setPage] = useState<Page>(Page.UserList);
  const [saveData, setSaveData] = useState<SaveDataModel>(initalSaveData);

  useEffect(() => {
    setSaveData(load());
  }, []);

  return (
    <PageContext.Provider value={{ setPage }}>
      <SaveDataContext.Provider value={{ saveData, setSaveData }}>
        {(() => {
          switch (page) {
            case Page.VisitedMap:
              return <VisitedMap />;
            case Page.UserList:
            default:
              return <UserList />;
          }
        })()}
      </SaveDataContext.Provider>
    </PageContext.Provider>
  );
}

export default App;
