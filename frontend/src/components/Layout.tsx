import { Outlet, NavLink, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Search,
  Bookmark,
  Database,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  GitCompare,
  Star,
  Building2,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const companyNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/search', icon: Search, label: 'Search Leads' },
  { to: '/saved-searches', icon: Star, label: 'Saved Searches' },
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { to: '/comparison', icon: GitCompare, label: 'Comparison' },
  { to: '/company-database', icon: Database, label: 'Company Database' },
  { to: '/account', icon: Settings, label: 'Account & Subscription' },
];

const adminNavItems = [
  { to: '/admin', icon: Shield, label: 'Admin Dashboard' },
  { to: '/admin/companies', icon: Building2, label: 'Companies' },
  { to: '/admin/usage', icon: BarChart3, label: 'Analytics' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect admin users to admin panel
  if (user?.role === 'ADMIN' && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />;
  }

  // Redirect company users away from admin panel
  if (user?.role !== 'ADMIN' && location.pathname.startsWith('/admin')) {
    return <Navigate to="/" replace />;
  }

  const items = user?.role === 'ADMIN' ? adminNavItems : companyNavItems;

  return (
    <div className="flex min-h-screen bg-surface-50">
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 lg:justify-center">
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-primary-700">SCIP</span>
            {user?.role === 'ADMIN' && (
              <span className="text-xs text-gray-500">Admin Panel</span>
            )}
          </div>
          <button
            type="button"
            className="rounded p-2 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-0.5 p-3">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-3">
          <div className="mb-2 truncate px-3 text-xs text-gray-500">
            {user?.company?.name ?? user?.email}
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col lg:min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4">
          <button
            type="button"
            className="rounded p-2 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
