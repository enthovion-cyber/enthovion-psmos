'use client';

import React from 'react';
import type { PsmElementDetail } from '../../types/executive-psm-element.types';
import { ExecutivePsmElementStatusBadge } from '../../shared/ExecutivePsmElementStatusBadge';
import { ExecutivePsmElementDataQualityBadge } from '../../shared/ExecutivePsmElementDataQualityBadge';

interface Props {
  detail: PsmElementDetail;
}

export function PsmElementOverviewTab({ detail }: Props) {
  const { element, score } = detail;

  return (
    <div className="space-y-6">
      {/* Top calculation basis cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <span className="text-xs uppercase text-[var(--psm-muted)] font-medium">Element Status</span>
          <div className="mt-2 flex items-center gap-2">
            <ExecutivePsmElementStatusBadge status={score.element_status} />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <span className="text-xs uppercase text-[var(--psm-muted)] font-medium">Data Quality</span>
          <div className="mt-2">
            <ExecutivePsmElementDataQualityBadge quality={score.data_quality_status} />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <span className="text-xs uppercase text-[var(--psm-muted)] font-medium">Source Modules</span>
          <div className="mt-1 text-2xl font-bold text-[var(--psm-text)]">
            {score.source_module_count - score.unavailable_module_count} / {score.source_module_count}
          </div>
          <span className="text-[11px] text-[var(--psm-muted)]">Connected & active</span>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <span className="text-xs uppercase text-[var(--psm-muted)] font-medium">Confidence Status</span>
          <div className="mt-1 text-2xl font-bold text-[var(--psm-text)]">
            {score.confidence_status ?? 'Standard'}
          </div>
        </div>
      </section>

      {/* Readiness & Penalties Grid */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
          <h3 className="font-bold text-base text-[var(--psm-text)]">Readiness Signals & Deficiencies</h3>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-[var(--psm-surface-2)] p-3">
              <dt className="text-xs text-[var(--psm-muted)]">Critical Open Items</dt>
              <dd className="mt-1 text-xl font-black text-rose-500">{score.critical_item_count}</dd>
            </div>
            <div className="rounded-lg bg-[var(--psm-surface-2)] p-3">
              <dt className="text-xs text-[var(--psm-muted)]">Overdue Actions</dt>
              <dd className="mt-1 text-xl font-black text-amber-500">{score.overdue_action_count}</dd>
            </div>
            <div className="rounded-lg bg-[var(--psm-surface-2)] p-3">
              <dt className="text-xs text-[var(--psm-muted)]">Missing Evidence</dt>
              <dd className="mt-1 text-xl font-black text-orange-500">{score.missing_evidence_count}</dd>
            </div>
            <div className="rounded-lg bg-[var(--psm-surface-2)] p-3">
              <dt className="text-xs text-[var(--psm-muted)]">Pending Approvals</dt>
              <dd className="mt-1 text-xl font-black text-blue-500">{score.pending_approval_count}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
          <h3 className="font-bold text-base text-[var(--psm-text)]">Element Governance Context</h3>
          <div className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between border-b border-[var(--psm-line)] pb-2">
              <span className="text-[var(--psm-muted)]">Element Code</span>
              <span className="font-mono font-bold text-[var(--psm-text)]">{element.element_code}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--psm-line)] pb-2">
              <span className="text-[var(--psm-muted)]">Category</span>
              <span className="font-bold text-[var(--psm-text)]">{element.element_category}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--psm-line)] pb-2">
              <span className="text-[var(--psm-muted)]">Foundation Requirement</span>
              <span className="font-bold text-[var(--psm-text)]">{element.required_foundation ? 'Mandatory PSM Baseline' : 'Operational Best Practice'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--psm-muted)]">Last Calculated</span>
              <span className="font-bold text-[var(--psm-text)]">
                {score.calculated_at ? new Date(score.calculated_at).toLocaleString() : '—'}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
