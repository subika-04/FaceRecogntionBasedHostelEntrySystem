import { NavLink, Link } from 'react-router-dom';
import {
  LayoutGrid, Users, ScanFace, History, BarChart3, FileDown, ShieldCheck, Settings, X, ScanEye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, roles: [ROLES.ADMIN, ROLES.STAFF] },
  { to: '/students', label: 'Students', icon: Users, roles: [ROLES.ADMIN, ROLES.STAFF] },
  { to: '/recognition/live', label: 'Live Recognition', icon: ScanFace, roles: [ROLES.ADMIN, ROLES.STAFF] },
  { to: '/recognition/history', label: 'Recognition History', icon: History, roles: [ROLES.ADMIN, ROLES.STAFF] },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: [ROLES.ADMIN] },
  { to: '/reports', label: 'Reports', icon: FileDown, roles: [ROLES.ADMIN] },
  { to: '/users', label: 'User Management', icon: ShieldCheck, roles: [ROLES.ADMIN] },
  { to: '/settings', label: 'System Settings', icon: Settings, roles: [ROLES.ADMIN] },
];

// On desktop (md+) this renders as a static column, always visible.
// Below md, it's hidden by default and instead renders as a fixed slide-in
// drawer with a backdrop, controlled by `open`/`onClose` from DashboardLayout
// (which owns the state and gives Topbar a hamburger button to toggle it).
export default function Sidebar({ open = false, onClose = () => {} }) {
  const { user } = useAuth();

  const navLinks = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {NAV_ITEMS.filter((item) => !user || item.roles.includes(user.role)).map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/15 text-white shadow-inner backdrop-blur-sm'
                  : 'text-indigo-100/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? 'text-white' : 'text-indigo-200/70 group-hover:text-white'}`}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 p-4 text-xs text-indigo-200/70">
      <p>
        Signed in as{' '}
        <span className="font-semibold text-white">{user?.role || '—'}</span>
      </p>
      <p className="mt-2 flex gap-3">
        <Link to="/help" onClick={onClose} className="hover:text-white">Help</Link>
        <Link to="/about" onClick={onClose} className="hover:text-white">About</Link>
      </p>
    </div>
  );

  const brandHeader = (closeButton) => (
    <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 font-display text-sm font-bold text-white shadow-inner backdrop-blur-sm">
        <ScanEye className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate font-display text-sm font-bold text-white">FRHES</p>
        <p className="truncate text-[11px] text-indigo-200/70">Hostel Entry System</p>
      </div>
      {closeButton}
    </div>
  );

  return (
    <>
      {/* Desktop: static column, always visible at md+ */}
      <aside className="bg-brand-gradient hidden w-64 shrink-0 flex-col shadow-xl md:flex print:hidden">
        {brandHeader(null)}
        {navLinks}
        {footer}
      </aside>

      {/* Mobile: backdrop + slide-in drawer, only mounted below md */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={`bg-brand-gradient fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col shadow-2xl transition-transform duration-200 ease-out md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {brandHeader(
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-indigo-100 hover:bg-white/10"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        {navLinks}
        {footer}
      </aside>
    </>
  );
}
