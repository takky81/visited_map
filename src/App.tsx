import { SaveDataProvider } from './contexts/SaveDataContext';
import AppRouter from './AppRouter';
import './App.css';

function App() {
  return (
    <SaveDataProvider>
      <AppRouter />
    </SaveDataProvider>
  );
}

export default App;
