import React, { useState } from 'react';
import {
  BedDouble,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Home,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareWarning,
  Settings,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import type { AuthSession } from '../types/hostel';

export type AdminTab =
  | 'dashboard'
  | 'students'
  | 'rooms'
  | 'applications'
  | 'allocations'
  | 'fees'
  | 'complaints'
  | 'settings';

export type StudentTab =
  | 'dashboard'
  | 'apply'
  | 'availability'
  | 'my-application'
  | 'my-room'
  | 'profile'
  | 'complaints';

export type ActiveTab = AdminTab | StudentTab;

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
}

const ADMIN_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'students', label: 'Students', icon: <Users className="w-4 h-4" /> },
  { id: 'rooms', label: 'Rooms', icon: <BedDouble className="w-4 h-4" /> },
  { id: 'applications', label: 'Applications', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'allocations', label: 'Room Allocation', icon: <Home className="w-4 h-4" /> },
  { id: 'fees', label: 'Fees & Payments', icon: <IndianRupee className="w-4 h-4" /> },
  { id: 'complaints', label: 'Complaints', icon: <MessageSquareWarning className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

const STUDENT_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'apply', label: 'Hostel Application', icon: <FileText className="w-4 h-4" /> },
  { id: 'availability', label: 'Room Availability', icon: <BedDouble className="w-4 h-4" /> },
  { id: 'my-application', label: 'My Application', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'my-room', label: 'My Room', icon: <Home className="w-4 h-4" /> },
  { id: 'profile', label: 'My Profile', icon: <UserCircle className="w-4 h-4" /> },
  { id: 'complaints', label: 'My Complaints', icon: <MessageSquareWarning className="w-4 h-4" /> },
];

interface LayoutShellProps {
  session: AuthSession;
  hostelName: string;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function LayoutShell({
  session,
  hostelName,
  activeTab,
  onSelectTab,
  onLogout,
  children,
}: LayoutShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = session.role === 'admin' ? ADMIN_NAV : STUDENT_NAV;
  const activeLabel =
    navItems.find((item) => item.id === activeTab)?.label ?? 'Dashboard';

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-150 shrink-0 no-print ${
          collapsed ? 'w-18' : 'w-64'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-violet-800 text-white flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-base text-slate-900 font-display truncate">
                Hostel Pro
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-violet-50 text-violet-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className={isActive ? 'text-violet-800' : 'text-slate-500'}>
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-full bg-white h-full border-r border-slate-200 flex flex-col z-10">
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-800 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-semibold text-base text-slate-900 font-display">
                  Hostel Pro
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Mobile navigation">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-violet-50 text-violet-900'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className={isActive ? 'text-violet-800' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 hidden sm:inline truncate">
                {hostelName}
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-medium text-slate-900 truncate">
                {activeLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900 leading-tight">
                {session.displayName}
              </p>
              <p className="text-xs text-slate-500">
                {session.role === 'admin' ? 'Administrator Portal' : 'Student Portal'}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
