import { useEffect, useState } from 'react';
import { Outlet, useLocation, matchPath } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { ROUTE_TITLES } from '../../utils/routeTitles';

export default function DashboardLayout() {
  const location = useLocation();
  const current = ROUTE_TITLES.find((r) => matchPath({ path: r.path, end: true }, location.pathname));
  const title = current?.title || 'FRHES';

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the mobile drawer automatically whenever the route changes, so
  // navigating doesn't leave the drawer open over the new page.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-surface dark:bg-ink">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
