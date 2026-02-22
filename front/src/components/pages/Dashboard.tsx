import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  FileText,
  Settings,
  LogOut,
  Building2,
  Key,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { allRoutes } from '../../router/allRoutes';
import { PERMISSIONS } from '../../utils/permissions';

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  permission?: string;
};

const linkBase =
  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors';

const Dashboard: React.FC = () => {
  const { user, logout, hasPermission } = useAuthStore();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = useNavigate();
  const loc = useLocation();
  const routes = allRoutes;

  // ✅ fix types اختلاف أسماء الحقول
  const username = (user as any)?.username ?? (user as any)?.name ?? 'User';
  const roleLabel =
    (user as any)?.role ??
    (user as any)?.roleName ??
    ((user as any)?.roles?.[0]?.name
      ? String((user as any).roles[0].name)
      : 'USER');
  const avatarSrc = (user as any)?.avatar ?? (user as any)?.imageUrl ?? '';

  // Safety check: if user is null, show loading
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-500">جارٍ تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  const navItems: NavItem[] = useMemo(
    () => [
      {
        to: '/dashboard/contacts',
        label: 'Contacts',
        icon: <Users className="h-5 w-5" />,
        permission: PERMISSIONS.CONTACT_VIEW,
      },
      {
        to: '/dashboard/organization',
        label: 'Organization',
        icon: <Building2 className="h-5 w-5" />,
        permission: PERMISSIONS.HOTEL_VIEW,
      },
      {
        to: '/dashboard/users',
        label: 'User Management',
        icon: <Settings className="h-5 w-5" />,
        permission: PERMISSIONS.USER_VIEW,
      },
      {
        to: '/dashboard/roles',
        label: 'Roles & Permissions',
        icon: <Shield className="h-5 w-5" />,
        permission: PERMISSIONS.ROLE_MANAGE,
      },
      {
        to: '/dashboard/permissions',
        label: 'Manage Permissions',
        icon: <Key className="h-5 w-5" />,
        permission: PERMISSIONS.ROLE_MANAGE,
      },
      {
        to: routes.auditLog,
        label: 'Audit Logs',
        icon: <FileText className="h-5 w-5" />,
        permission: PERMISSIONS.LOG_VIEW,
      },
    ],
    []
  );

  const visibleItems = useMemo(
    () => navItems.filter((i) => !i.permission || hasPermission?.(i.permission)),
    [navItems, hasPermission]
  );

  const openLogout = () => setIsLogoutOpen(true);
  const closeLogout = () => setIsLogoutOpen(false);
  const closeSidebar = () => setSidebarOpen(false);

  const confirmLogout = () => {
    logout();
    if (loc.pathname.startsWith('/dashboard')) {
      nav('/login', { replace: true });
    }
  };

  const sidebarContent = (
    <>
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
          <Users className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">Nexus Contact</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `${linkBase} ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Me"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-slate-300 font-semibold">
                {String(username).slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{username}</p>
            <p className="text-xs text-slate-400 truncate">{roleLabel}</p>
          </div>
        </div>

        <button
          onClick={openLogout}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-slate-50" dir="rtl">
      {/* Mobile: overlay backdrop when sidebar open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR — Desktop: fixed right | Mobile: overlay drawer */}
      <aside
        className={`
          fixed top-0 right-0 h-screen w-72 bg-slate-900 text-white flex flex-col z-50
          transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          md:translate-x-0
        `}
      >
        {sidebarContent}
      </aside>

      {/* MAIN */}
      <main className="min-h-screen flex-1 md:pr-72 w-full min-w-0">
        {/* Mobile header with menu toggle */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            aria-label="فتح القائمة"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <span className="text-lg font-bold text-slate-900">Nexus Contact</span>
          <div className="w-10" aria-hidden="true" />
        </header>

        <div className="h-screen overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* Logout Modal */}
      {isLogoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={closeLogout}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-md border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900">Confirm Logout</h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to log out?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeLogout}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-sm"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
