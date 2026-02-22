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
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { allRoutes } from '../router/allRoutes';
import { PERMISSIONS } from '../utils/permissions';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MainLayout = () => {
  const { user, logout, hasPermission } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop mini variant
  const [userMenuOpen, setUserMenuOpen] = useState(false); // User dropdown
  
  const nav = useNavigate();
  const loc = useLocation();
  const routes = allRoutes;

  // Derive user info
  const username = user?.username ?? user?.name ?? 'User';
  const roleLabel =
    user?.role ??
    user?.roleName ??
    (user?.roles?.[0]?.name ? String(user.roles[0].name) : 'USER');
  const avatarSrc = user?.avatar ?? user?.imageUrl ?? '';

  // Navigation Items
  const navItems = useMemo(
    () => [
      {
        to: routes.contacts,
        label: 'Contacts',
        icon: Users,
        permission: PERMISSIONS.CONTACT_VIEW,
      },
      {
        to: routes.organization,
        label: 'Organization',
        icon: Building2,
        permission: PERMISSIONS.HOTEL_VIEW,
      },
      {
        to: routes.adminUsers,
        label: 'User Management',
        icon: Settings,
        permission: PERMISSIONS.USER_VIEW,
      },
      {
        to: routes.adminRoles,
        label: 'Roles & Permissions',
        icon: Shield,
        permission: PERMISSIONS.ROLE_MANAGE,
      },
      {
        to: routes.adminPermissions,
        label: 'Manage Permissions',
        icon: Key,
        permission: PERMISSIONS.ROLE_MANAGE,
      },
      {
        to: routes.auditLog,
        label: 'Audit Logs',
        icon: FileText,
        permission: PERMISSIONS.LOG_VIEW,
      },
    ],
    [routes]
  );

  const visibleItems = useMemo(
    () => navItems.filter((i) => !i.permission || hasPermission?.(i.permission)),
    [navItems, hasPermission]
  );

  const handleLogout = () => {
    logout();
    nav('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-start" dir="rtl">
      {/* Mobile Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar - Fixed Position */}
      <aside 
        className={cn(
          "fixed top-0 right-0 z-50 h-screen bg-slate-900 text-slate-100 transition-all duration-300 ease-in-out border-l border-slate-800 flex flex-col shadow-2xl lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
          sidebarCollapsed ? "lg:w-20" : "lg:w-72",
          "w-72" // Mobile width always 72
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "h-16 flex items-center border-b border-slate-800 transition-all duration-300 flex-shrink-0",
          sidebarCollapsed ? "lg:justify-center lg:px-0" : "justify-between px-6"
        )}>
          {/* Logo Area */}
          <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-white overflow-hidden whitespace-nowrap">
             <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
               <span className="text-white text-lg font-bold">N</span>
             </div>
             <span className={cn(
               "transition-all duration-300 origin-right", 
               sidebarCollapsed ? "lg:w-0 lg:opacity-0 lg:scale-95 hidden lg:block" : "w-auto opacity-100 scale-100"
             )}>
               Nexus
             </span>
          </div>

           {/* Mobile Close Button */}
           <button 
             onClick={() => setSidebarOpen(false)}
             className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white transition-colors"
           >
             <X className="h-6 w-6" />
           </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-1 custom-scrollbar">
           {visibleItems.map((item) => (
             <NavLink
               key={item.to}
               to={item.to}
               onClick={() => setSidebarOpen(false)}
               className={({ isActive }) => cn(
                 "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative select-none cursor-pointer",
                 isActive 
                   ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 ring-1 ring-indigo-500" 
                   : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                 sidebarCollapsed ? "lg:justify-center" : ""
               )}
               title={sidebarCollapsed ? item.label : undefined}
             >
               <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-transform duration-200", sidebarCollapsed && "group-hover:scale-110")} />
               
               <span className={cn(
                 "font-medium truncate transition-all duration-300",
                 sidebarCollapsed ? "lg:w-0 lg:opacity-0 lg:hidden" : "w-auto opacity-100"
               )}>
                 {item.label}
               </span>
               
               {/* Tooltip for collapsed state */}
               {sidebarCollapsed && (
                 <div className="hidden lg:block absolute right-full mr-4 z-50 px-3 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl border border-slate-700">
                   {item.label}
                   {/* Arrow */}
                   <div className="absolute top-1/2 -right-1 -mt-1 w-2 h-2 bg-slate-800 rotate-45 border-t border-r border-slate-700"></div>
                 </div>
               )}
             </NavLink>
           ))}
        </nav>

        {/* User Profile (Bottom) */}
        <div className="p-4 border-t border-slate-800 flex-shrink-0 bg-slate-900">
           <div className={cn("flex items-center gap-3", sidebarCollapsed ? "lg:justify-center" : "")}>
              <div 
                className="relative flex-shrink-0 group cursor-pointer" 
                onClick={() => !sidebarCollapsed && setUserMenuOpen((prev) => !prev)}
              >
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600 group-hover:border-indigo-500 transition-colors shadow-sm">
                  {avatarSrc ? <img src={avatarSrc} alt="User" className="w-full h-full object-cover"/> : <span className="font-semibold text-slate-300">{username.charAt(0).toUpperCase()}</span>}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse"></div>
              </div>
              
              <div className={cn(
                "flex-1 min-w-0 transition-all duration-300",
                sidebarCollapsed ? "lg:w-0 lg:opacity-0 lg:hidden" : "w-auto opacity-100"
              )}>
                <p className="text-sm font-semibold text-white truncate hover:text-indigo-400 transition-colors cursor-pointer">{username}</p>
                <p className="text-xs text-slate-400 truncate">{roleLabel}</p>
              </div>
           </div>
           
           <button 
             onClick={handleLogout}
             className={cn(
               "mt-4 flex items-center justify-center gap-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-rose-950/30 hover:text-rose-400 hover:border-rose-900/30 border border-transparent transition-all duration-200 text-sm font-medium overflow-hidden group",
               sidebarCollapsed ? "lg:w-10 lg:h-10 lg:p-0 lg:mx-auto w-full py-2" : "w-full py-2"
             )}
             title="تسجيل الخروج"
           >
             <LogOut className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
             <span className={cn(sidebarCollapsed ? "lg:hidden" : "block")}>تسجيل خروج</span>
           </button>
        </div>
      </aside>

      {/* Main Content Wrapper - with dynamic margin */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out w-full",
          // Desktop margins based on sidebar state
          sidebarCollapsed ? "lg:mr-20" : "lg:mr-72",
          // Mobile margin always 0
          "mr-0"
        )}
      >
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm flex items-center justify-between px-4 lg:px-8 transition-all duration-300">
           <div className="flex items-center gap-4">
             {/* Mobile Menu Button */}
             <button 
               onClick={() => setSidebarOpen(true)}
               className="lg:hidden p-2 -mr-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
               aria-label="Open Sidebar"
             >
               <Menu className="h-6 w-6" />
             </button>

             {/* Desktop Collapse Button */}
             <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              aria-label="Toggle Sidebar"
             >
               {sidebarCollapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
             </button>

             {/* Breadcrumb / Title */}
             <div className="hidden sm:block border-r border-slate-200 pr-4 mr-1">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  {/* Dynamic Title based on route or static for now */}
                  {navItems.find(item => item.to === loc.pathname)?.label || 'Dashboard'}
                </h2>
             </div>
           </div>

        </header>

        {/* Page Content */}
        <main className="flex-1 w-full max-w-full p-4 lg:p-8 overflow-x-hidden">
           {/* Content Container - Limits width on huge screens but full on laptop */}
           <div className="w-full max-w-[1920px] mx-auto space-y-6">
             <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
