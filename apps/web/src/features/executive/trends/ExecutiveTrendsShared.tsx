'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  TrendingUp,
  Sliders,
  Layers,
  LayoutDashboard,
  ShieldAlert,
  Flame,
  AlertTriangle,
  History,
  Sparkles,
  ArrowRightLeft,
  Compass,
  FileSpreadsheet,
  FileCheck2,
  GitBranch,
  Play,
  Activity,
  Calendar,
} from 'lucide-react';
import { AuthThemeToggle } from '@/features/auth/components/AuthThemeToggle';

export const trendTabs = [
  { href: '/executive/trends', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/executive/trends/explorer', label: 'KPI Trend Explorer', icon: Compass },
  { href: '/executive/trends/compare', label: 'Cross-Site Compare', icon: ArrowRightLeft },
  { href: '/executive/trends/critical-risks', label: 'Critical Risk Trends', icon: ShieldAlert },
  { href: '/executive/trends/overdue-actions', label: 'Overdue Action Trends', icon: Calendar },
  { href: '/executive/trends/escalations', label: 'Escalation SLAs', icon: Activity },
  { href: '/executive/trends/repeat-issues', label: 'Repeat Issues', icon: Flame },
  { href: '/executive/trends/recurring-issues', label: 'Recurring Clusters', icon: GitBranch },
  { href: '/executive/trends/insights', label: 'Rule-Based Insights', icon: Sparkles },
  { href: '/executive/trends/alerts', label: 'Trend Alerts', icon: AlertTriangle },
  { href: '/executive/trends/alert-rules', label: 'Alert Rules', icon: Sliders },
  { href: '/executive/trends/runs', label: 'Historical Runs', icon: History },
  { href: '/executive/trends/methodology', label: 'Methodology & Versions', icon: FileCheck2 },
  { href: '/executive/trends/settings', label: 'Trend Settings', icon: FileSpreadsheet },
];

export function ExecutiveTrendsNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--psm-line)] pb-3">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs">
        {trendTabs.map((tab) => {
          const isActive =
            tab.href === '/executive/trends'
              ? pathname === '/executive/trends' || pathname === '/executive/trends/dashboard'
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

export function ExecutiveTrendsHeader({
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
        <div className="flex items-center gap-2">
          <span className="rounded bg-[var(--psm-primary)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--psm-primary)] uppercase tracking-wider">
            Executive PSM Intelligence · Phase 7
          </span>
          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">
            Immutable Historical Data
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

export function ExecutiveDataQualityNotice({
  coverageRate = 96,
  missingCount = 0,
}: {
  coverageRate?: number | undefined;
  missingCount?: number | undefined;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 text-xs text-[var(--psm-muted)]">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span>
          <strong className="text-[var(--psm-text)]">Integrity Assurance:</strong> Verified historical observations only. No data is fabricated or backfilled. Missing observations ({missingCount}) are explicitly flagged.
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span>Coverage: <strong className="text-[var(--psm-text)]">{coverageRate}%</strong></span>
        <span>Version: <strong className="text-[var(--psm-text)]">2026.1-Phase7</strong></span>
      </div>
    </div>
  );
}
