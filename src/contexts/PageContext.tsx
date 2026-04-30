import { createContext } from 'react';
import type Page from '../enums/Page';

export const PageContext = createContext<{
  setPage: React.Dispatch<React.SetStateAction<Page>>;
}>({
  setPage: () => {},
});
