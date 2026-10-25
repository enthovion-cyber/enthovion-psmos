'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  Bell,
  Bot,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileText,
  Gauge,
  GitBranch,
  GraduationCap,
  HardHat,
  Layers3,
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
  executive: Gauge,
  ptw: HardHat,
  moc: GitBranch,
  pssr: ClipboardCheck,
  hazop: ShieldAlert,
  lopa: Shield,
  incidents: AlertTriangle,
  mechanical_integrity: Wrench,
  psi: FileCheck2,
  equipment: ShieldCheck,
  documents: FileText,
  actions: Gauge,
  notifications: Bell,
  search: Search,
  users: Users,
  roles: ShieldCheck,
  settings: Settings,
  hierarchy: Layers3,
  company: Building2,
  site: Building2,
  department: Users,
  unit: Wrench,
  area: ClipboardList,
  workflows: GitBranch,
  training: GraduationCap,
  regulatory: FileCheck2,
  operating_procedures: ClipboardList,
  contractor_safety: HardHat,
  copilot: Bot,
  audit: FileCheck2,
  reports: FileCheck2,
  signature: FileCheck2
};

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebar();
  const navigationQuery = useMyNavigation();

  useEffect(() => {
    setMounted(true);
  }, []);
  const backendItems = (navigationQuery.data?.items ?? []).filter((item: BackendNavItem) => item.href !== '/dashboard');
  const hasExecutiveDashboard = backendItems.some((item: BackendNavItem) => item.href === '/executive');
  const hasOperatingProcedures = backendItems.some((item: BackendNavItem) => item.href === '/operating-procedures');
  const hasContractorSafety = backendItems.some((item: BackendNavItem) => item.href === '/contractor-safety');
  const hasDashboardAccess = backendItems.length > 0 || (navigationQuery.data?.items ?? []).some((item: BackendNavItem) => item.href === '/dashboard');
  const resolvedItems: BackendNavItem[] = [
    ...(!hasExecutiveDashboard && hasDashboardAccess
      ? [{ label: 'Executive Dashboard', href: '/executive', moduleKey: 'executive', group: 'overview' }]
      : []),
    ...backendItems,
    ...(!hasOperatingProcedures && hasDashboardAccess
      ? [{ label: 'Operating Procedures', href: '/operating-procedures', moduleKey: 'operating_procedures', group: 'modules' }]
      : []),
    ...(!backendItems.some((item: BackendNavItem) => item.href === '/copilot') && hasDashboardAccess
      ? [{ label: 'PSM Copilot', href: '/copilot', moduleKey: 'copilot', group: 'modules' }]
      : []),
    ...(!hasContractorSafety && hasDashboardAccess
      ? [{ label: 'Contractor Safety', href: '/contractor-safety', moduleKey: 'contractor_safety', group: 'modules' }]
      : [])
  ];
  const navigationItems = resolvedItems.map((item: BackendNavItem) => ({
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
        <Link href="/executive" className={`flex min-w-0 items-center gap-3 ${collapsed ? 'lg:justify-center' : ''}`}>
          <img src="/dark.svg" alt="Enthovion" className="h-20 w-16 shrink-0 object-contain" />
          <div className={`min-w-0 transition-opacity duration-200 ${collapsed ? 'lg:hidden lg:opacity-0' : 'opacity-100'}`}>
            <div className="truncate text-xl font-extrabold leading-none tracking-[.02em] text-white">ENTHOVION</div>
            <div className="mt-1 truncate text-xl font-extrabold leading-none tracking-[.02em]"><span className="text-[var(--psm-primary)]">PSM</span><span className="text-white"> OS</span></div>
          </div>
        </Link>
        
        {/* Sleek toggle button - placed gracefully depending on state */}
        <button 
          type="button" 
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} 
          onClick={toggleCollapsed} 
          className={`psm-sidebar-muted hidden rounded-md p-2 hover:bg-white/10 hover:text-white lg:grid transition-all ${collapsed ? 'mt-2' : ''}`}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {/* Mobile close button */}
        <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)} className="psm-sidebar-muted rounded-md p-2 hover:bg-white/10 hover:text-white lg:hidden">
          <X size={18} />
        </button>
      </div>

      {/* 2. SCROLLABLE NAVIGATION AREA WITH CUSTOM SCROLLBAR */}
      <div className={`flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 ${collapsed ? 'lg:px-2 lg:overflow-x-hidden' : ''}`}>
        <nav className="space-y-6">
          {!mounted || navigationQuery.isLoading ? <NavigationSkeleton collapsed={collapsed} /> : null}
          {mounted && navigationQuery.isError ? <NavigationError collapsed={collapsed} /> : null}
          {mounted && !navigationQuery.isLoading && !navigationQuery.isError && orderedGroups.length === 0 ? (
            <NavigationEmpty collapsed={collapsed} />
          ) : null}
          {mounted &&
            !navigationQuery.isLoading &&
            !navigationQuery.isError &&
            orderedGroups.map((group) => (
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
      <div className={`shrink-0 border-t border-white/15 p-4 ${collapsed ? 'lg:p-2' : ''}`}>
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
      <aside className={`psm-sidebar fixed inset-y-0 left-0 z-50 flex h-screen w-72 ${desktopWidth} flex-col border-r shadow-2xl transition-[transform,width] duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
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
          <div className={`mb-2 h-3 rounded bg-white/15 ${collapsed ? 'lg:mx-auto lg:w-7' : 'w-20'}`} />
          <div className="space-y-2">
            {[0, 1, 2].map((row) => <div key={row} className="h-10 rounded-lg bg-white/10" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function NavigationError({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`rounded-lg border border-red-300/35 bg-red-950/30 p-3 text-xs text-red-100 ${collapsed ? 'lg:hidden' : ''}`}>
      Navigation could not be loaded. Your direct route permissions are still enforced by the backend.
    </div>
  );
}

function NavigationEmpty({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`psm-sidebar-muted rounded-lg border border-white/15 bg-white/5 p-3 text-xs ${collapsed ? 'lg:hidden' : ''}`}>
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
      <div className={`psm-sidebar-muted mb-2 px-2 text-[11px] font-semibold uppercase tracking-[.16em] transition-all ${collapsed ? 'lg:text-center lg:text-[10px] lg:tracking-widest' : ''}`}>
        {collapsed ? title.slice(0, 3) : title}
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/executive' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              aria-current={active ? 'page' : undefined}
              className={`psm-sidebar-link group flex min-h-10 items-center gap-3 rounded-r-lg px-3 py-2 text-sm font-medium transition-all ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
            >
              <item.icon size={18} className="shrink-0 text-current" />
              <span className={`truncate transition-opacity duration-200 ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
