'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  CheckSquare,
  Clock,
  FileText,
  Layers,
  LayoutDashboard,
  ShieldAlert,
  Sliders,
  History,
  ArrowRightLeft,
  Users,
  Compass,
  Sparkles,
} from 'lucide-react';
import { AuthThemeToggle } from '@/features/auth/components/AuthThemeToggle';

export function ExecutiveManagementReviewNav({
  activeTab,
}: {
  activeTab?: string | undefined;
} = {}) {
  const pathname = usePathname();

  const links = [
    { href: '/executive/management-review', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/executive/management-review/cycles', label: 'Review Cycles', icon: Layers },
    { href: '/executive/management-review/meetings', label: 'Meetings', icon: Users },
    { href: '/executive/management-review/calendar', label: 'Calendar', icon: Calendar },
    { href: '/executive/management-review/agenda', label: 'Agenda & Templates', icon: FileText },
    { href: '/executive/management-review/packages', label: 'Review Packages', icon: Compass },
    { href: '/executive/management-review/readiness', label: 'Readiness', icon: ShieldAlert },
    { href: '/executive/management-review/minutes', label: 'Minutes & Records', icon: FileText },
    { href: '/executive/management-review/decisions', label: 'Decisions', icon: Sparkles },
    { href: '/executive/management-review/commitments', label: 'Commitments', icon: CheckSquare },
    { href: '/executive/management-review/follow-up', label: 'Follow-Up Tracker', icon: Clock },
    { href: '/executive/management-review/carried-forward', label: 'Carried-Forward', icon: ArrowRightLeft },
    { href: '/executive/management-review/settings', label: 'Settings', icon: Sliders },
    { href: '/executive/management-review/history', label: 'History', icon: History },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--psm-line)] pb-3">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs">
        {links.map((link) => {
          const isActive =
            link.href === '/executive/management-review'
              ? pathname === '/executive/management-review' || pathname === '/executive/management-review/dashboard'
              : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
                isActive
                  ? 'bg-[var(--psm-primary)] text-white shadow-sm font-semibold'
                  : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-text)]'
              }`}
            >
              <Icon size={14} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-2 shrink-0">
        <AuthThemeToggle />
      </div>
    </div>
  );
}

export function ExecutiveManagementReviewHeader({
  title,
  subtitle,
  description,
  actions,
}: {
  title: string;
  subtitle?: string | undefined;
  description?: string | undefined;
  actions?: React.ReactNode | undefined;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-[var(--psm-primary)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--psm-primary)] uppercase tracking-wider">
            Executive Governance · Phase 6
          </span>
        </div>
        <h1 className="mt-1 text-2xl font-black text-[var(--psm-text)]">{title}</h1>
        {(subtitle || description) && (
          <p className="mt-1 text-sm text-[var(--psm-muted)]">{subtitle || description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function ManagementReviewEmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-base font-bold text-[var(--psm-text)]">{title}</p>
      <p className="mt-1 max-w-md text-xs text-[var(--psm-muted)]">{message}</p>
    </div>
  );
}

export const cardStyle =
  'rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm';
export const buttonStyle =
  'inline-flex items-center justify-center rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-xs font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)] transition disabled:opacity-50';
export const primaryButtonStyle =
  'inline-flex items-center justify-center rounded-lg bg-[var(--psm-primary)] px-3 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition disabled:opacity-50';
export const inputStyle =
  'rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-xs text-[var(--psm-text)] placeholder-[var(--psm-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--psm-primary)]';

export {
  ExecutiveManagementReviewNav as ManagementReviewNav,
  ExecutiveManagementReviewHeader as ManagementReviewHeader,
};

