import { createContext, useContext, useState } from 'react';
import Page from '../enums/Page';

interface PageContextValue {
  page: Page;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
}

const PageContext = createContext<PageContextValue>({
  page: Page.UserList,
  setPage: () => {},
});

export function PageProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<Page>(Page.UserList);
  return <PageContext.Provider value={{ page, setPage }}>{children}</PageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePage() {
  return useContext(PageContext);
}
