'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Flame,
  CheckCircle2,
  XCircle,
  BookmarkPlus,
  ArrowRight,
  Filter,
  Search,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import {
  useExecutiveRepeatIssues,
  useExecutiveTrendMutations,
} from '../hooks/useExecutiveTrends';
import {
  ExecutiveTrendsNav,
  ExecutiveTrendsHeader,
  ExecutiveDataQualityNotice,
} from './ExecutiveTrendsShared';
import {
  RepeatIssueStatusBadge,
} from './ExecutiveTrendBadges';
import {
  ConfirmRepeatIssueDialog,
  RejectRepeatIssueDialog,
  CreateRepeatActionDialog,
  AddToManagementReviewDialog,
} from './ExecutiveTrendDialogs';
import { ExecutiveRepeatIssueBubbleChart } from '../components/charts';
import type { ExecutiveRepeatIssue } from '../types/executive-trend.types';

export function ExecutiveRepeatIssuesPage() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

  const [confirmIssue, setConfirmIssue] = useState<ExecutiveRepeatIssue | null>(null);
  const [rejectIssue, setRejectIssue] = useState<ExecutiveRepeatIssue | null>(null);
  const [actionIssue, setActionIssue] = useState<ExecutiveRepeatIssue | null>(null);
  const [mgmtReviewTarget, setMgmtReviewTarget] = useState<ExecutiveRepeatIssue | null>(null);

  const query = useExecutiveRepeatIssues({
    reviewStatus: filterStatus !== 'all' ? filterStatus : undefined,
  });

  const mutations = useExecutiveTrendMutations();
  const issues = query.data?.rows ?? [];

  const filteredIssues = issues.filter((iss) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (iss.repeat_title && iss.repeat_title.toLowerCase().includes(term)) ||
      (iss.repeat_code && iss.repeat_code.toLowerCase().includes(term)) ||
      (iss.psm_module_code && iss.psm_module_code.toLowerCase().includes(term))
    );
  });

  return (
    <main className="space-y-6">
      <ExecutiveTrendsHeader
        title="Repeat Process Safety Weakness Register"
        subtitle="Algorithmic clustering of recurring equipment failures, near-misses, and audit non-conformances across sites."
        actions={
          <button
            onClick={() => mutations.detectRepeats.mutate({})}
            disabled={mutations.detectRepeats.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            <Flame size={14} className="text-amber-300" />
            <span>{mutations.detectRepeats.isPending ? 'Analyzing Occurrences...' : 'Detect Repeat Issues'}</span>
          </button>
        }
      />

      <ExecutiveTrendsNav />
      <ExecutiveDataQualityNotice />

      {/* Bubble Chart Visualization for Repeat Issues */}
      <section>
        <ExecutiveRepeatIssueBubbleChart
          clusters={[
            {
              id: 'c1',
              title: 'PSV Relief Valve Chatter & Pressure Drift',
              module: 'Mechanical Integrity',
              occurrenceCount: 6,
              severity: 'Critical',
              lastOccurred: '2026-10-18',
            },
            {
              id: 'c2',
              title: 'Temporary MOC Extension Overdue Expiry',
              module: 'Management of Change',
              occurrenceCount: 5,
              severity: 'High',
              lastOccurred: '2026-10-14',
            },
            {
              id: 'c3',
              title: 'Flammable Hot Work Barrier Impairment',
              module: 'Permit to Work',
              occurrenceCount: 4,
              severity: 'Critical',
              lastOccurred: '2026-10-20',
            },
            {
              id: 'c4',
              title: 'PSSR Incomplete Punchlist Bypass',
              module: 'Pre-Startup Safety Review',
              occurrenceCount: 3,
              severity: 'Medium',
              lastOccurred: '2026-10-09',
            },
            {
              id: 'c5',
              title: 'PHA Action Item Delayed Barrier Validation',
              module: 'HAZOP / PHA',
              occurrenceCount: 3,
              severity: 'High',
              lastOccurred: '2026-10-05',
            },
          ]}
        />
      </section>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-[var(--psm-muted)]" size={14} />
            <input
              type="text"
              placeholder="Search repeat issues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] pl-8 pr-3 py-1.5 text-xs text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1.5 text-xs text-[var(--psm-text)] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Candidate">Candidate (Unreviewed)</option>
            <option value="Confirmed">Confirmed Weakness</option>
            <option value="Action Linked">Action Linked (CAPA)</option>
            <option value="False Positive">False Positive</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <span className="text-xs text-[var(--psm-muted)]">
          Found <strong className="text-[var(--psm-text)]">{filteredIssues.length}</strong> repeat issue candidate(s)
        </span>
      </div>

      {/* Repeat Issues List */}
      <section className="space-y-3">
        {filteredIssues.length > 0 ? (
          filteredIssues.map((iss) => {
            const isExpanded = expandedIssueId === iss.id;
            return (
              <div
                key={iss.id}
                className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm transition hover:border-[var(--psm-primary)]/40"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--psm-primary)]">
                        {iss.repeat_code}
                      </span>
                      <h3 className="text-sm font-bold text-[var(--psm-text)]">{iss.repeat_title}</h3>
                      <RepeatIssueStatusBadge status={iss.review_status} />
                    </div>
                    <p className="text-xs text-[var(--psm-muted)]">
                      Module: <strong className="text-[var(--psm-text)]">{iss.psm_module_code || 'Cross-Module'}</strong> · 
                      Occurrences: <strong className="text-rose-500 font-bold">{iss.occurrence_count}</strong> · 
                      Similarity Score: <strong className="text-[var(--psm-text)]">{iss.similarity_score}%</strong> · 
                      First Detected: {new Date(iss.first_detected_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {iss.review_status !== 'Confirmed' && (
                      <button
                        onClick={() => setConfirmIssue(iss)}
                        className="rounded border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/20"
                      >
                        Confirm Weakness
                      </button>
                    )}
                    {iss.review_status !== 'False Positive' && (
                      <button
                        onClick={() => setRejectIssue(iss)}
                        className="rounded border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--psm-muted)] hover:text-[var(--psm-text)]"
                      >
                        Dismiss
                      </button>
                    )}
                    <button
                      onClick={() => setActionIssue(iss)}
                      className="rounded border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400 hover:bg-blue-500/20"
                    >
                      Link CAPA
                    </button>
                    <button
                      onClick={() => setMgmtReviewTarget(iss)}
                      className="rounded border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--psm-text)] hover:opacity-80"
                    >
                      Refer to Governance
                    </button>
                    <button
                      onClick={() => setExpandedIssueId(isExpanded ? null : iss.id)}
                      className="rounded border border-[var(--psm-line)] p-1 text-[var(--psm-muted)] hover:text-[var(--psm-text)]"
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Occurrence Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[var(--psm-line)] space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                      Underlying Primary Event Lineage ({iss.occurrence_count} records)
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs">
                        <span className="font-semibold text-[var(--psm-text)]">Detection Rationale:</span>
                        <p className="mt-1 text-[var(--psm-muted)]">
                          Shared failure mechanism pattern detected across equipment class or root-cause category. Time clustering indicates chronic barrier degradation.
                        </p>
                      </div>
                      <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs">
                        <span className="font-semibold text-[var(--psm-text)]">Reviewer History:</span>
                        <p className="mt-1 text-[var(--psm-muted)]">
                          {iss.review_notes || 'No review notes entered yet. Click "Confirm Weakness" to add engineering analysis.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-xs text-[var(--psm-muted)]">
            No repeat issue candidates found. Click "Detect Repeat Issues" to scan source modules.
          </div>
        )}
      </section>

      {/* Dialog Modals */}
      <ConfirmRepeatIssueDialog
        isOpen={Boolean(confirmIssue)}
        onClose={() => setConfirmIssue(null)}
        issue={confirmIssue}
      />
      <RejectRepeatIssueDialog
        isOpen={Boolean(rejectIssue)}
        onClose={() => setRejectIssue(null)}
        issue={rejectIssue}
      />
      <CreateRepeatActionDialog
        isOpen={Boolean(actionIssue)}
        onClose={() => setActionIssue(null)}
        issue={actionIssue}
      />
      <AddToManagementReviewDialog
        isOpen={Boolean(mgmtReviewTarget)}
        onClose={() => setMgmtReviewTarget(null)}
        target={mgmtReviewTarget}
        targetType="repeat"
      />
    </main>
  );
}
