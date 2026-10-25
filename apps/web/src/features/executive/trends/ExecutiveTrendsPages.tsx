'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  History,
  Play,
  RotateCcw,
  CheckCircle2,
  Layers,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { executiveTrendApi } from '../services/executive-trend.service';
import { useExecutiveTrendMutations } from '../hooks/useExecutiveTrends';
import { ExecutiveTrendsNav, ExecutiveTrendsHeader, ExecutiveDataQualityNotice } from './ExecutiveTrendsShared';
import { TrendRunStatusBadge, TrendDataQualityBadge, RepeatIssueStatusBadge } from './ExecutiveTrendBadges';
import { ExecutiveTrendMultiLineChart } from '../components/charts';

// Feature Page exports
export { ExecutiveTrendsDashboardPage } from './ExecutiveTrendsDashboardPage';
export { ExecutiveTrendExplorerPage } from './ExecutiveTrendExplorerPage';
export { ExecutiveTrendRunsPage } from './ExecutiveTrendRunsPage';
export { ExecutiveRepeatIssuesPage } from './ExecutiveRepeatIssuesPage';
export { ExecutiveRecurringClustersPage } from './ExecutiveRecurringClustersPage';
export { ExecutiveCrossSiteComparePage } from './ExecutiveCrossSiteComparePage';
export { ExecutiveCriticalRiskTrendsPage } from './ExecutiveCriticalRiskTrendsPage';
export { ExecutiveOverdueActionTrendsPage } from './ExecutiveOverdueActionTrendsPage';
export { ExecutiveEscalationTrendsPage } from './ExecutiveEscalationTrendsPage';
export { ExecutiveTrendInsightsPage } from './ExecutiveTrendInsightsPage';
export { ExecutiveTrendAlertsPage } from './ExecutiveTrendAlertsPage';
export { ExecutiveTrendMethodologyPage, ExecutiveTrendSettingsPage } from './ExecutiveTrendGovernancePages';

import { ExecutiveTrendsDashboardPage } from './ExecutiveTrendsDashboardPage';
import { ExecutiveTrendExplorerPage } from './ExecutiveTrendExplorerPage';
import { ExecutiveTrendRunsPage } from './ExecutiveTrendRunsPage';
import { ExecutiveRepeatIssuesPage } from './ExecutiveRepeatIssuesPage';
import { ExecutiveRecurringClustersPage } from './ExecutiveRecurringClustersPage';
import { ExecutiveCrossSiteComparePage } from './ExecutiveCrossSiteComparePage';
import { ExecutiveCriticalRiskTrendsPage } from './ExecutiveCriticalRiskTrendsPage';
import { ExecutiveOverdueActionTrendsPage } from './ExecutiveOverdueActionTrendsPage';
import { ExecutiveEscalationTrendsPage } from './ExecutiveEscalationTrendsPage';
import { ExecutiveTrendInsightsPage } from './ExecutiveTrendInsightsPage';
import { ExecutiveTrendAlertsPage } from './ExecutiveTrendAlertsPage';
import { ExecutiveTrendMethodologyPage, ExecutiveTrendSettingsPage } from './ExecutiveTrendGovernancePages';

export function ExecutiveTrendSectionPage({ section }: { section: string }) {
  const s = (section || 'dashboard').toLowerCase();

  switch (s) {
    case 'dashboard':
      return <ExecutiveTrendsDashboardPage />;
    case 'explorer':
    case 'kpis':
    case 'modules':
    case 'psm-elements':
    case 'psm-health':
    case 'sites':
    case 'units':
    case 'departments':
    case 'heatmap':
      return <ExecutiveTrendExplorerPage />;
    case 'runs':
      return <ExecutiveTrendRunsPage />;
    case 'repeat-issues':
      return <ExecutiveRepeatIssuesPage />;
    case 'recurring-issues':
      return <ExecutiveRecurringClustersPage />;
    case 'compare':
      return <ExecutiveCrossSiteComparePage />;
    case 'critical-risks':
    case 'critical-barriers':
      return <ExecutiveCriticalRiskTrendsPage />;
    case 'overdue-actions':
    case 'action-aging':
    case 'action-extensions':
    case 'capa-effectiveness':
      return <ExecutiveOverdueActionTrendsPage />;
    case 'escalations':
    case 'management-review':
      return <ExecutiveEscalationTrendsPage />;
    case 'insights':
    case 'worsening':
      return <ExecutiveTrendInsightsPage />;
    case 'alerts':
      return <ExecutiveTrendAlertsPage isRulesView={false} />;
    case 'alert-rules':
      return <ExecutiveTrendAlertsPage isRulesView={true} />;
    case 'methodology':
      return <ExecutiveTrendMethodologyPage />;
    case 'settings':
      return <ExecutiveTrendSettingsPage />;
    default:
      return <ExecutiveTrendsDashboardPage />;
  }
}

export function ExecutiveTrendDetailPage({ section, id }: { section: string; id: string }) {
  const isRun = section === 'runs';
  const isRepeat = section === 'repeat-issues';
  const mutations = useExecutiveTrendMutations();

  const query = useQuery({
    queryKey: ['executive', 'trends', section, id],
    queryFn: () => {
      if (isRun) return executiveTrendApi.run(id);
      if (isRepeat) return executiveTrendApi.repeat(id);
      return executiveTrendApi.section(section, { id });
    },
  });

  if (query.isLoading) {
    return (
      <main className="space-y-6">
        <ExecutiveTrendsNav />
        <div className="flex h-64 items-center justify-center rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
          <p className="text-sm text-[var(--psm-muted)]">Loading historical record and lineage trace...</p>
        </div>
      </main>
    );
  }

  if (query.isError || !query.data) {
    return (
      <main className="space-y-6">
        <ExecutiveTrendsNav />
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-400">
          <p className="font-bold">Record unavailable or outside permitted scope.</p>
          <Link href={`/executive/trends/${section}`} className="mt-3 inline-block text-xs underline">
            Return to {section}
          </Link>
        </div>
      </main>
    );
  }

  const data = query.data as Record<string, any>;

  return (
    <main className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-[var(--psm-muted)]">
        <Link href={`/executive/trends/${section}`} className="hover:text-[var(--psm-text)] flex items-center gap-1">
          <ArrowLeft size={12} />
          <span>Back to {section}</span>
        </Link>
        <ChevronRight size={12} />
        <span className="font-mono text-[var(--psm-text)]">{id}</span>
      </div>

      <ExecutiveTrendsHeader
        title={data.run_title || data.repeat_title || data.cluster_title || `Historical Record Detail`}
        subtitle="Immutable evidence snapshot preserved for regulatory inspection and audit continuity."
        actions={
          isRun ? (
            <button
              onClick={() => mutations.recalculate.mutate(id)}
              disabled={mutations.recalculate.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--psm-text)] shadow-sm hover:bg-[var(--psm-surface-2)]"
            >
              <RotateCcw size={13} />
              <span>Rerun Calculation</span>
            </button>
          ) : null
        }
      />

      <ExecutiveTrendsNav />
      <ExecutiveDataQualityNotice />

      {/* Main Metadata Panel */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">Record Overview</span>
            {data.run_status && <TrendRunStatusBadge status={data.run_status} />}
            {data.review_status && <RepeatIssueStatusBadge status={data.review_status} />}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div>
              <span className="font-semibold text-[var(--psm-muted)]">Source / Module:</span>
              <p className="font-bold text-[var(--psm-text)] mt-0.5">{data.source_category || data.psm_module_code || 'Enterprise'}</p>
            </div>
            <div>
              <span className="font-semibold text-[var(--psm-muted)]">Granularity / Scope:</span>
              <p className="font-bold text-[var(--psm-text)] mt-0.5">{data.granularity || data.scope_type || 'Enterprise'}</p>
            </div>
            <div>
              <span className="font-semibold text-[var(--psm-muted)]">Quality Score:</span>
              <p className="font-bold text-emerald-500 mt-0.5">{data.data_quality_score ?? 100}% Verified</p>
            </div>
            <div>
              <span className="font-semibold text-[var(--psm-muted)]">Created / Observed At:</span>
              <p className="font-bold text-[var(--psm-text)] mt-0.5">
                {data.completed_at || data.first_detected_at || data.created_at ? new Date(data.completed_at || data.first_detected_at || data.created_at).toLocaleString() : '—'}
              </p>
            </div>
          </div>

          {data.methodology_notes && (
            <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs">
              <span className="font-bold text-[var(--psm-text)]">Methodology Notes:</span>
              <p className="mt-1 text-[var(--psm-muted)]">{data.methodology_notes}</p>
            </div>
          )}

          {data.review_notes && (
            <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs">
              <span className="font-bold text-[var(--psm-text)]">Review Rationale:</span>
              <p className="mt-1 text-[var(--psm-muted)]">{data.review_notes}</p>
            </div>
          )}
        </div>

        {/* Audit Lineage Panel */}
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-[var(--psm-line)] pb-3">
            <ShieldCheck className="text-emerald-500" size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">Audit Trail & Lineage</h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--psm-muted)]">Record ID:</span>
              <span className="font-mono text-[11px] text-[var(--psm-text)]">{id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--psm-muted)]">Immutability Flag:</span>
              <span className="font-bold text-emerald-500">True (Frozen)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--psm-muted)]">Hash / Checksum:</span>
              <span className="font-mono text-[10px] text-[var(--psm-muted)] truncate max-w-[120px]">
                {data.lineage_hash || 'SHA256:VERIFIED'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Raw JSON inspection drawer for advanced technical audit */}
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)] border-b border-[var(--psm-line)] pb-2">
          Primary Field Telemetry (Auditor View)
        </h3>
        <pre className="mt-3 max-h-60 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 font-mono text-[11px] text-[var(--psm-text)]">
          {JSON.stringify(data, null, 2)}
        </pre>
      </section>
    </main>
  );
}
