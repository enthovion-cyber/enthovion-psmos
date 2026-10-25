// apps/web/src/features/contractor-safety/ContractorSafetyUi.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  Users,
  GraduationCap,
  ClipboardCheck,
  BarChart3,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import type { CsmSafetyGrade, CsmStatus, CsmTier, CsmVerificationStatus } from './types/contractor-safety.types';

export const CSM_NAV_TABS = [
  { label: 'Overview & KPIs', href: '/contractor-safety', icon: BarChart3 },
  { label: 'Contractors Directory', href: '/contractor-safety/contractors', icon: Building2 },
  { label: 'Prequalification & Grading', href: '/contractor-safety/prequalification', icon: ShieldCheck, phaseBadge: 'Phase 2' },
  { label: 'Worker Credentials', href: '/contractor-safety/credentials', icon: Users, phaseBadge: 'Phase 3' },
  { label: 'Site Inductions & Badges', href: '/contractor-safety/inductions', icon: GraduationCap, phaseBadge: 'Phase 4' },
  { label: 'Job Evaluations & Audit', href: '/contractor-safety/evaluations', icon: ClipboardCheck, phaseBadge: 'Phase 5' }
];

export function ContractorSafetyHeader({
  title,
  subtitle,
  actions
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = theme === 'dark' ? Moon : Sun;

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 pt-6 pb-0 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              OSHA 29 CFR 1910.119(h)
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Contractor Safety Management
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {actions}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-colors"
            title={`Toggle Theme (Current: ${theme})`}
            aria-label="Toggle dark/light theme"
          >
            <ThemeIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none border-t border-slate-100 dark:border-slate-800 pt-1 -mb-px">
        {CSM_NAV_TABS.map((tab) => {
          const isActive =
            tab.href === '/contractor-safety'
              ? pathname === '/contractor-safety'
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.phaseBadge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {tab.phaseBadge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function CsmTierBadge({ tier }: { tier: CsmTier | string }) {
  switch (tier) {
    case 'TIER_1':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          Tier 1 (High Risk)
        </span>
      );
    case 'TIER_2':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
          Tier 2 (Medium)
        </span>
      );
    case 'TIER_3':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          Tier 3 (Low)
        </span>
      );
  }
}

export function CsmStatusBadge({ status }: { status: CsmStatus | string }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
          Active / Approved
        </span>
      );
    case 'CONDITIONAL':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
          Conditional Approval
        </span>
      );
    case 'PENDING_PREQUAL':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-900">
          Pending Prequal
        </span>
      );
    case 'SUSPENDED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
          Suspended
        </span>
      );
    case 'DISQUALIFIED':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {status}
        </span>
      );
  }
}

export function CsmGradeBadge({ grade, score }: { grade: CsmSafetyGrade | string; score?: number | null | undefined }) {
  const getStyle = () => {
    switch (grade) {
      case 'A':
        return 'bg-emerald-500 text-white shadow-emerald-500/20';
      case 'B':
        return 'bg-blue-600 text-white shadow-blue-500/20';
      case 'C':
        return 'bg-amber-500 text-white shadow-amber-500/20';
      case 'D':
      case 'F':
        return 'bg-rose-600 text-white shadow-rose-500/20';
      default:
        return 'bg-slate-400 text-white';
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shadow-sm ${getStyle()}`}
      >
        {grade}
      </span>
      {score !== undefined && score !== null && (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{score}%</span>
      )}
    </div>
  );
}

export function CsmDocStatusBadge({ status }: { status: CsmVerificationStatus | string }) {
  switch (status) {
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
          Verified
        </span>
      );
    case 'PENDING_REVIEW':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-900 animate-pulse">
          Pending Review
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
          Rejected
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
          Expired
        </span>
      );
    case 'MISSING':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          Missing
        </span>
      );
  }
}

export function CsmVarianceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'APPROVED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
          Approved Variance
        </span>
      );
    case 'PENDING_APPROVAL':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900 animate-pulse">
          Pending Approval
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
          Rejected
        </span>
      );
    case 'EXPIRED':
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {status}
        </span>
      );
  }
}

export function CsmBadgeStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active Badge
        </span>
      );
    case 'PENDING_VERIFICATION':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pending Verification
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Expired Credentials
        </span>
      );
    case 'SUSPENDED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          Suspended
        </span>
      );
    case 'REVOKED':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Revoked
        </span>
      );
  }
}

export function CsmCertStatusBadge({ status, isExpired }: { status: string; isExpired?: boolean | undefined }) {
  if (isExpired || status === 'EXPIRED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
        Expired
      </span>
    );
  }
  switch (status) {
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
          Verified
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
          Pending Review
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {status}
        </span>
      );
  }
}

export function CsmTradeBadge({ trade }: { trade: string }) {
  const map: Record<string, { label: string; bg: string }> = {
    PIPEFITTER: { label: 'Pipefitter', bg: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' },
    WELDER_ASME9: { label: 'Welder (ASME IX)', bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
    SCAFFOLDER_COMPETENT: { label: 'Scaffold Competent', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    ELECTRICIAN_EE: { label: 'Electrician (EE)', bg: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' },
    INSTRUMENT_TECH: { label: 'Instrumentation Tech', bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
    RIGGER: { label: 'Rigger / Signal Person', bg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
    MILLWRIGHT: { label: 'Millwright', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    INSULATOR: { label: 'Mechanical Insulator', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    GENERAL_LABOR: { label: 'General Craft Labor', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' }
  };

  const item = map[trade] ?? { label: trade, bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${item.bg}`}>
      {item.label}
    </span>
  );
}

export function CsmSkillLevelBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    APPRENTICE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    JOURNEYMAN: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    FOREMAN: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-bold',
    SUPERINTENDENT: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-bold',
    MASTER_CRAFTSMAN: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold'
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${map[level] ?? 'bg-slate-100 text-slate-700'}`}>
      {level.replace('_', ' ')}
    </span>
  );
}

export function CsmPassStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active Gate Pass
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Pass Expired
        </span>
      );
    case 'SUSPENDED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Suspended
        </span>
      );
    case 'REVOKED':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Revoked
        </span>
      );
  }
}

export function CsmInductionStatusBadge({
  status,
  score
}: {
  status: string;
  score?: number | null | undefined;
}) {
  switch (status) {
    case 'PASSED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          Passed {score !== undefined && score !== null ? `(${score}%)` : ''}
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          Failed {score !== undefined && score !== null ? `(${score}%)` : ''}
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          Expired (Annual)
        </span>
      );
    case 'IN_PROGRESS':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          In Progress
        </span>
      );
  }
}

export function CsmEvaluationScoreBadge({ score }: { score: number }) {
  let color = 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  let label = 'Unsatisfactory';

  if (score >= 90) {
    color = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    label = 'Superior (90%+)';
  } else if (score >= 80) {
    color = 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    label = 'Good (80-89%)';
  } else if (score >= 70) {
    color = 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    label = 'Adequate (70-79%)';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      <span className="font-bold">{score}%</span>
      <span className="opacity-80">· {label}</span>
    </span>
  );
}

export function CsmEvaluationStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'ACKNOWLEDGED_BY_VENDOR':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          Vendor Acknowledged
        </span>
      );
    case 'UNDER_DISPUTE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          Under Dispute
        </span>
      );
    case 'CLOSED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          Closed
        </span>
      );
    case 'SUBMITTED':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          Submitted
        </span>
      );
  }
}

export function CsmRollingSafetyIndexBadge({ index }: { index: number }) {
  let badgeColor = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900';
  if (index >= 90) {
    badgeColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900';
  } else if (index >= 80) {
    badgeColor = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900';
  } else if (index >= 70) {
    badgeColor = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900';
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border font-mono font-bold text-sm shadow-sm ${badgeColor}`}>
      <span>{index.toFixed(1)}%</span>
      <span className="text-[10px] uppercase font-sans tracking-wide opacity-80">Safety Index</span>
    </div>
  );
}
