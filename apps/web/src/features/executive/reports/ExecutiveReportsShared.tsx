'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  ShieldCheck,
  LayoutDashboard,
  Layers,
  Calendar,
  Users,
  Clock,
  Send,
  AlertTriangle,
  FileCheck2,
  BookmarkPlus,
  Compass,
} from 'lucide-react';
import { AuthThemeToggle } from '@/features/auth/components/AuthThemeToggle';

export const reportTabs = [
  { href: '/executive/reports', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/executive/reports/board', label: 'Board Packages', icon: ShieldCheck },
  { href: '/executive/reports/register', label: 'Report Register', icon: FileText },
  { href: '/executive/reports/new', label: 'Report Builder', icon: BookmarkPlus },
  { href: '/executive/reports/templates', label: 'Templates', icon: Layers },
  { href: '/executive/reports/periods', label: 'Reporting Periods', icon: Calendar },
  { href: '/executive/reports/audiences', label: 'Audience Profiles', icon: Users },
  { href: '/executive/reports/schedules', label: 'Schedules', icon: Clock },
  { href: '/executive/reports/distribution', label: 'Distribution & Access', icon: Send },
  { href: '/executive/reports/staleness', label: 'Staleness & Lineage', icon: AlertTriangle },
];

export function ExecutiveReportsNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--psm-line)] pb-3">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs">
        {reportTabs.map((tab) => {
          const isActive =
            tab.href === '/executive/reports'
              ? pathname === '/executive/reports' || pathname === '/executive/reports/dashboard'
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
                isActive
                  ? 'bg-[var(--psm-primary)] text-white shadow-sm font-semibold'
                  : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-text)]'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
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

export function ExecutiveReportsHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string | undefined;
  actions?: React.ReactNode | undefined;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-[var(--psm-primary)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--psm-primary)] uppercase tracking-wider">
            Executive PSM Reporting · Phase 8
          </span>
          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">
            Immutable Sealed Snapshots
          </span>
          <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-500">
            Audit-Ready Evidence
          </span>
        </div>
        <h1 className="mt-1 text-2xl font-black text-[var(--psm-text)]">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--psm-muted)]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function ExecutiveReportIntegrityNotice({
  readinessRate = 100,
  missingSourcesCount = 0,
}: {
  readinessRate?: number | undefined;
  missingSourcesCount?: number | undefined;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 text-xs text-[var(--psm-muted)]">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${readinessRate >= 90 ? 'bg-emerald-500' : readinessRate >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`} />
        <span>
          <strong className="text-[var(--psm-text)]">Governance Assurance:</strong> Reports document governance health and source-verified observations. This does not constitute legal or statutory compliance certification.
          {missingSourcesCount > 0 && (
            <span className="ml-1 text-amber-500 font-medium">({missingSourcesCount} source modules missing or incomplete)</span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span>Readiness Score: <strong className="text-[var(--psm-text)]">{readinessRate}%</strong></span>
        <span>Standard: <strong className="text-[var(--psm-text)]">OSHA 1910.119 / CCPS RBPS</strong></span>
      </div>
    </div>
  );
}
