'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  Bell,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileText,
  Gauge,
  GitBranch,
  GraduationCap,
  HardHat,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  Wrench,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMyNavigation } from '@/features/iam/hooks/useIam';
import { SidebarFooterUserMenu } from '@/features/app-shell/SidebarFooterUserMenu';
import { useSidebar } from '@/providers/SidebarProvider';

type BackendNavItem = {
  label: string;
  href: string;
  moduleKey: string;
  group: string;
};

const groupLabels: Record<string, string> = {
  overview: 'Overview',
  modules: 'Modules',
  foundation: 'Foundation',
  admin: 'Admin'
};

const groupOrder = ['overview', 'modules', 'foundation', 'admin'];

const iconByModule: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  ptw: HardHat,
  moc: GitBranch,
  pssr: ClipboardCheck,
  hazop: ShieldAlert,
  lopa: Shield,
  incidents: AlertTriangle,
  equipment: ShieldCheck,
  documents: FileText,
  actions: Gauge,
  notifications: Bell,
  search: Search,
  users: Users,
  roles: ShieldCheck,
  settings: Settings,
  company: Building2,
  site: Building2,
  department: Users,
  unit: Wrench,
  area: ClipboardList,
  workflows: GitBranch,
  training: GraduationCap,
  audit: FileCheck2,
  reports: FileCheck2,
  signature: FileCheck2
};

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebar();
  const navigationQuery = useMyNavigation();
  const navigationItems = (navigationQuery.data?.items ?? []).map((item: BackendNavItem) => ({
    ...item,
    icon: iconByModule[item.moduleKey] ?? Settings
  }));
  const groupedItems = navigationItems.reduce<Record<string, Array<BackendNavItem & { icon: LucideIcon }>>>((acc, item) => {
    acc[item.group] = [...(acc[item.group] ?? []), item];
    return acc;
  }, {});
  const orderedGroups = [
    ...groupOrder.filter((group) => groupedItems[group]?.length),
    ...Object.keys(groupedItems).filter((group) => !groupOrder.includes(group))
  ];
  const desktopWidth = collapsed ? 'lg:w-20' : 'lg:w-72';

  const content = (
    <>
      {/* 1. FIXED HEADER */}
      <div className={`shrink-0 px-4 py-5 flex items-center justify-between gap-3 ${collapsed ? 'lg:flex-col lg:justify-center lg:px-2' : ''}`}>
        <Link href="/dashboard" className={`flex min-w-0 items-center gap-3 ${collapsed ? 'lg:justify-center' : ''}`}>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-sm font-black text-white shadow-lg shadow-primary/25">
            <Shield size={20} />
          </div>
          <div className={`min-w-0 transition-opacity duration-200 ${collapsed ? 'lg:hidden lg:opacity-0' : 'opacity-100'}`}>
            <div className="truncate text-lg font-semibold">PSM OS</div>
            <div className="truncate text-xs text-[var(--psm-muted)]">Operational Excellence</div>
          </div>
        </Link>
        
        {/* Sleek toggle button - placed gracefully depending on state */}
        <button 
          type="button" 
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} 
          onClick={toggleCollapsed} 
          className={`hidden rounded-md p-2 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] lg:grid transition-all ${collapsed ? 'mt-2' : ''}`}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {/* Mobile close button */}
        <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)} className="rounded-md p-2 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] lg:hidden">
          <X size={18} />
        </button>
      </div>

      {/* 2. SCROLLABLE NAVIGATION AREA WITH CUSTOM SCROLLBAR */}
      <div className={`flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 ${collapsed ? 'lg:px-2 lg:overflow-x-hidden' : ''}`}>
        <nav className="space-y-6">
          {navigationQuery.isLoading ? <NavigationSkeleton collapsed={collapsed} /> : null}
          {navigationQuery.isError ? <NavigationError collapsed={collapsed} /> : null}
          {!navigationQuery.isLoading && !navigationQuery.isError && orderedGroups.length === 0 ? <NavigationEmpty collapsed={collapsed} /> : null}
          {orderedGroups.map((group) => (
            <NavGroup
              key={group}
              title={groupLabels[group] ?? group}
              items={groupedItems[group] ?? []}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </nav>
      </div>

      {/* 3. FIXED FOOTER USER MENU */}
      <div className={`shrink-0 p-4 border-t border-[var(--psm-line)] ${collapsed ? 'lg:p-2' : ''}`}>
        <SidebarFooterUserMenu collapsed={collapsed} onNavigate={() => setOpen(false)} />
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-40 grid h-10 w-10 place-items-center rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] text-[var(--psm-text)] shadow-lg lg:hidden"
      >
        <Menu size={20} />
      </button>
      
      {open ? <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} /> : null}
      
      {/* Changed absolute aside structure to flex h-screen so only the inner nav scrolls */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 ${desktopWidth} flex-col border-r border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl transition-[transform,width] duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {content}
      </aside>
    </>
  );
}

function NavigationSkeleton({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map((group) => (
        <div key={group}>
          <div className={`mb-2 h-3 rounded bg-[var(--psm-surface-3)] ${collapsed ? 'lg:mx-auto lg:w-7' : 'w-20'}`} />
          <div className="space-y-2">
            {[0, 1, 2].map((row) => <div key={row} className="h-10 rounded-lg bg-[var(--psm-surface-2)]" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function NavigationError({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger ${collapsed ? 'lg:hidden' : ''}`}>
      Navigation could not be loaded. Your direct route permissions are still enforced by the backend.
    </div>
  );
}

function NavigationEmpty({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs text-[var(--psm-muted)] ${collapsed ? 'lg:hidden' : ''}`}>
      No modules are available for your current role, company, site, or plan.
    </div>
  );
}

function NavGroup({
  title,
  items,
  pathname,
  collapsed,
  onNavigate
}: {
  title: string;
  items: Array<{ label: string; icon: LucideIcon; href: string }>;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  return (
    <div>
      <div className={`mb-2 px-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[var(--psm-muted)] transition-all ${collapsed ? 'lg:text-center lg:text-[10px] lg:tracking-widest' : ''}`}>
        {collapsed ? title.slice(0, 3) : title}
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={`group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${
                active
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] hover:text-[var(--psm-text)]'
              }`}
            >
              <item.icon size={18} className={`shrink-0 ${active ? 'text-white' : 'text-[var(--psm-muted)] group-hover:text-[var(--psm-text)]'}`} />
              <span className={`truncate transition-opacity duration-200 ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
