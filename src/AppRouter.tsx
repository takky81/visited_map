import { usePage } from './contexts/PageContext';
import Page from './enums/Page';
import UserList from './pages/UserList/UserList';
import VisitedMap from './pages/VisitedMap/VisitedMap';

export default function AppRouter() {
  const { page } = usePage();

  switch (page) {
    case Page.VisitedMap:
      return <VisitedMap />;
    case Page.UserList:
    default:
      return <UserList />;
  }
}
