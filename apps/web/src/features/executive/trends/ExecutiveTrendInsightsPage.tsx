'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  BookmarkPlus,
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  Flame,
  Info,
} from 'lucide-react';
import {
  useExecutiveTrendInsights,
  useExecutiveTrendMutations,
} from '../hooks/useExecutiveTrends';
import {
  ExecutiveTrendsNav,
  ExecutiveTrendsHeader,
  ExecutiveDataQualityNotice,
} from './ExecutiveTrendsShared';
import {
  InsightCategoryBadge,
} from './ExecutiveTrendBadges';
import { AddToManagementReviewDialog } from './ExecutiveTrendDialogs';
import type { ExecutiveTrendInsight } from '../types/executive-trend.types';

export function ExecutiveTrendInsightsPage() {
  const [filterCategory, setFilterCategory] = useState('all');
  const [mgmtReviewInsight, setMgmtReviewInsight] = useState<ExecutiveTrendInsight | null>(null);

  const query = useExecutiveTrendInsights();
  const mutations = useExecutiveTrendMutations();
  const insights = query.data?.rows ?? [];

  const filtered = insights.filter((ins) => {
    if (filterCategory === 'all') return true;
    return ins.insight_category === filterCategory;
  });

  return (
    <main className="space-y-6">
      <ExecutiveTrendsHeader
        title="Rule-Based Executive Trend Insights"
        subtitle="Explainable, deterministic pattern recognition highlighting systemic risks, consecutive degradation, and emerging vulnerabilities."
      />

      <ExecutiveTrendsNav />
      <ExecutiveDataQualityNotice />

      {/* Filter and Category Controls */}
      <div className="flex items-center justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
            Category Filter:
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs text-[var(--psm-text)] focus:outline-none"
          >
            <option value="all">All Insight Categories</option>
            <option value="Worsening Trend">Worsening Trend</option>
            <option value="Chronic Repeat">Chronic Repeat Issue</option>
            <option value="Cross-Site Outlier">Cross-Site Outlier</option>
            <option value="SLA Breach Pattern">SLA Breach Pattern</option>
          </select>
        </div>

        <span className="text-xs text-[var(--psm-muted)]">
          Total Insights: <strong className="text-[var(--psm-text)]">{filtered.length}</strong>
        </span>
      </div>

      {/* Insight Cards */}
      <section className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((ins) => (
            <div
              key={ins.id}
              className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm transition hover:border-[var(--psm-primary)]/40"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <InsightCategoryBadge category={ins.insight_category} />
                    <h3 className="text-sm font-bold text-[var(--psm-text)]">{ins.insight_title}</h3>
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                      {ins.confidence_score}% deterministic match
                    </span>
                  </div>

                  <p className="text-xs text-[var(--psm-text)] leading-relaxed max-w-3xl">
                    {ins.insight_narrative}
                  </p>

                  {ins.recommended_action && (
                    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5 text-xs text-[var(--psm-muted)]">
                      <strong className="text-[var(--psm-text)]">Recommended Executive Action:</strong> {ins.recommended_action}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => mutations.reviewInsight.mutate({ insightId: ins.id, dto: { reviewStatus: 'Reviewed' } })}
                    className="flex items-center gap-1 rounded border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--psm-text)] hover:opacity-80"
                  >
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>Acknowledge</span>
                  </button>
                  <button
                    onClick={() => setMgmtReviewInsight(ins)}
                    className="flex items-center gap-1 rounded bg-[var(--psm-primary)] px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:opacity-90"
                  >
                    <BookmarkPlus size={13} />
                    <span>Refer to Governance</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-xs text-[var(--psm-muted)]">
            No active trend insights detected in current historical data.
          </div>
        )}
      </section>

      <AddToManagementReviewDialog
        isOpen={Boolean(mgmtReviewInsight)}
        onClose={() => setMgmtReviewInsight(null)}
        target={mgmtReviewInsight}
        targetType="insight"
      />
    </main>
  );
}
