'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export function SidebarModuleItem({ label, href, icon: Icon, active, collapsed, onNavigate }: { label: string; href: string; icon: LucideIcon; active: boolean; collapsed: boolean; onNavigate: (() => void) | undefined }) {
  return (
    <Link
      href={href}
      {...(onNavigate ? { onClick: onNavigate } : {})}
      {...(collapsed ? { title: label } : {})}
      className={`group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${
        active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] hover:text-[var(--psm-text)]'
      }`}
    >
      <Icon size={18} className={`shrink-0 ${active ? 'text-white' : 'text-[var(--psm-muted)] group-hover:text-[var(--psm-text)]'}`} />
      <span className={`truncate transition-opacity duration-200 ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
    </Link>
  );
}
