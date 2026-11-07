import { Outlet } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';
import { PublicFooter } from '../components/PublicFooter';

export function PublicLayout() {
  return (
    <>
      <PublicHeader />
      <main role="main">
        <Outlet />
      </main>
      <PublicFooter />
    </>
  );
}
