import { SaveDataProvider } from './contexts/SaveDataContext';
import { PageProvider } from './contexts/PageContext';
import AppRouter from './AppRouter';
import './App.css';

function App() {
  return (
    <SaveDataProvider>
      <PageProvider>
        <AppRouter />
      </PageProvider>
    </SaveDataProvider>
  );
}

export default App;
