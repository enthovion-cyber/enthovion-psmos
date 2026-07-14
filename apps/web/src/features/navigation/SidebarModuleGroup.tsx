'use client';

import type { LucideIcon } from 'lucide-react';
import { SidebarModuleItem } from './SidebarModuleItem';

export function SidebarModuleGroup({ title, items, pathname, collapsed, onNavigate }: { title: string; items: Array<{ label: string; icon: LucideIcon; href: string }>; pathname: string; collapsed: boolean; onNavigate?: () => void }) {
  if (!items.length) return null;
  return (
    <div>
      <div className={`mb-2 px-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[var(--psm-muted)] transition-all ${collapsed ? 'lg:text-center lg:text-[10px] lg:tracking-widest' : ''}`}>
        {collapsed ? title.slice(0, 3) : title}
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <SidebarModuleItem
            key={item.href}
            {...item}
            active={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}
