'use client';

import React from 'react';
import { RefreshCw, Camera, ShieldCheck, ListChecks } from 'lucide-react';
import type { PsmElementDetail } from '../types/executive-psm-element.types';
import { ExecutivePsmElementStatusBadge } from '../shared/ExecutivePsmElementStatusBadge';
import { ExecutivePsmElementCategoryBadge } from '../shared/ExecutivePsmElementCategoryBadge';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';

interface Props {
  detail: PsmElementDetail;
  onRefresh?: () => void;
  onSnapshot?: () => void;
  refreshing?: boolean;
}

export function ExecutivePsmElementHeader({
  detail,
  onRefresh,
  onSnapshot,
  refreshing = false,
}: Props) {
  const { element, score } = detail;
  const scoreVal = score?.score_value;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--psm-primary)]/10 text-[var(--psm-primary)] shrink-0">
          <ListChecks className="h-6 w-6" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--psm-text)]">{element.element_name}</h1>
            <ExecutivePsmElementStatusBadge status={score?.element_status ?? 'Insufficient Data'} />
            <ExecutivePsmElementCategoryBadge category={element.element_category} />
          </div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Code: <code className="rounded bg-[var(--psm-surface-2)] px-1.5 py-0.5 font-mono">{element.element_code}</code>
            {' · '}Quality: <span className="font-semibold text-[var(--psm-text)]">{score?.data_quality_status ?? 'Standard'}</span>
            {element.element_description ? ` · ${element.element_description}` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1.5 text-center">
          <span className="text-xs uppercase tracking-wider text-[var(--psm-muted)]">Score</span>
          <span className="text-xl font-black text-[var(--psm-text)]">
            {scoreVal != null ? `${scoreVal}/100` : '—'}
          </span>
        </div>

        <ExecutiveThemeToggle />

        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Recalculate
          </button>
        ) : null}

        {onSnapshot ? (
          <button
            type="button"
            onClick={onSnapshot}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--psm-primary)] px-3 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
          >
            <Camera className="h-4 w-4" />
            Snapshot
          </button>
        ) : null}
      </div>
    </div>
  );
}
