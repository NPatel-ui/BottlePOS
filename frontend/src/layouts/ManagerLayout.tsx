import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  ScrollText,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Store,
  PackageSearch,
  LineChart,
  Users
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { AnimatePresence, motion } from 'framer-motion';

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/dashboard/inventory', icon: PackageSearch, label: 'Inventory', end: false },
  { to: '/admin/dashboard/analytics', icon: LineChart, label: 'Analytics', end: false },
  { to: '/admin/dashboard/staff', icon: Users, label: 'Staff & POS', end: false },
  { to: '/admin/dashboard/shield', icon: ShieldAlert, label: 'Shield Alerts', end: false },
  { to: '/admin/dashboard/audit', icon: ScrollText, label: 'Audit Trail', end: false },
];

export default function ManagerLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const currentUser = useAuthStore((state) => state.currentUser);

  const displayUsername = currentUser?.username || 'Admin';
  const displayInitial = displayUsername.charAt(0).toUpperCase();

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1),
    path: '/' + pathSegments.slice(0, i + 1).join('/'),
  }));

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden font-sans">
      {/* Sidebar - Bright & Airy */}
      <aside
        className={`h-full bg-white flex flex-col shrink-0 transition-all duration-300 ease-out border-r border-separator shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 ${
          collapsed ? 'w-[80px]' : 'w-[260px]'
        }`}
      >
        {/* Brand */}
        <div className="h-20 flex items-center justify-between px-6 shrink-0 border-b border-separator/50">
          {!collapsed ? (
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-button shrink-0">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div className="overflow-hidden">
                <span className="text-base font-extrabold text-label-primary tracking-tight leading-tight block truncate">BottlePOS</span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest block truncate">Management</span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-button mx-auto shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pt-6 space-y-2 overflow-y-auto overflow-x-hidden">
          {!collapsed && (
            <p className="text-[11px] font-extrabold text-label-tertiary uppercase tracking-[0.2em] px-2 pb-2">Main Menu</p>
          )}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-apple-lg text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-primary text-white shadow-button scale-[1.02]'
                      : 'text-label-secondary hover:bg-surfaceHover hover:text-label-primary hover:scale-[1.02]'
                  } ${collapsed ? 'justify-center px-0' : ''}`
                }
                title={item.label}
              >
                <Icon className={`w-5 h-5 shrink-0`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User / Collapse */}
        <div className="p-4 border-t border-separator/50 flex flex-col gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-apple text-label-tertiary hover:text-label-primary hover:bg-surfaceHover transition-all duration-200 ${collapsed ? 'justify-center px-0' : ''}`}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="w-5 h-5 shrink-0" /> : <PanelLeftClose className="w-5 h-5 shrink-0" />}
            {!collapsed && <span className="text-sm font-bold truncate">Collapse</span>}
          </button>
          
          <div className={`flex items-center gap-3 p-3 rounded-apple-lg bg-surfaceHover border border-separator/50 transition-all duration-200 mt-2 ${collapsed ? 'justify-center px-0 bg-transparent border-transparent' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-xs font-extrabold text-white shrink-0 shadow-sm uppercase">
              {displayInitial}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-label-primary truncate">{displayUsername}</p>
                <p className="text-xs font-medium text-label-tertiary truncate">Admin</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={handleLogout} className="p-2 rounded-full hover:bg-white text-label-secondary hover:text-danger transition-all duration-200 shadow-sm border border-transparent hover:border-separator shrink-0" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md flex items-center px-8 shrink-0 border-b border-separator z-10 sticky top-0">
          <nav className="flex items-center gap-2 text-sm font-bold">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.path} className="flex items-center gap-2">
                {i > 0 && <span className="text-label-tertiary">/</span>}
                <span className={i === breadcrumbs.length - 1 ? 'text-primary' : 'text-label-tertiary hover:text-label-primary transition-colors cursor-pointer'}>
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
        </header>

        <main className="flex-1 overflow-auto p-8 relative bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
