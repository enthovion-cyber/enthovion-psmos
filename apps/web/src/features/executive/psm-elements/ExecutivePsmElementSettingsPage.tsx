'use client';

import React from 'react';
import { useExecutivePsmElementSettings } from '../hooks/useExecutivePsmElementSettings';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

export function ExecutivePsmElementSettingsPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const query = useExecutivePsmElementSettings();

  const settings = query.data ?? {};

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
            Executive KPI · Settings
          </p>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">PSM Elements Scoring Settings</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Configure scoring thresholds, penalty coefficients, and multi-module dependency rules.
          </p>
        </div>
        <ExecutiveThemeToggle />
      </header>

      {query.isLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
      ) : (
        <div className="max-w-2xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-sm">
          <h2 className="text-base font-bold text-[var(--psm-text)]">Active Scoring Rules & Penalty Weights</h2>
          <dl className="mt-4 divide-y divide-[var(--psm-line)] text-sm">
            <div className="flex justify-between py-3">
              <dt className="text-[var(--psm-muted)]">Scoring Engine</dt>
              <dd className="font-semibold text-[var(--psm-text)]">
                {String(settings.psm_element_score_method ?? 'weighted_kpi_and_gap_penalty')}
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-[var(--psm-muted)]">Critical Gap Penalty</dt>
              <dd className="font-semibold text-rose-500">
                -{String(settings.psm_element_critical_gap_penalty ?? 15)} pts
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-[var(--psm-muted)]">Overdue Action Penalty</dt>
              <dd className="font-semibold text-amber-500">
                -{String(settings.psm_element_overdue_action_penalty ?? 10)} pts
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-[var(--psm-muted)]">Missing Evidence Penalty</dt>
              <dd className="font-semibold text-orange-500">
                -{String(settings.psm_element_missing_evidence_penalty ?? 8)} pts
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-[var(--psm-muted)]">Stale Record Penalty</dt>
              <dd className="font-semibold text-amber-500">
                -{String(settings.psm_element_stale_record_penalty ?? 6)} pts
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-[var(--psm-muted)]">Pending Approval Penalty</dt>
              <dd className="font-semibold text-blue-500">
                -{String(settings.psm_element_pending_approval_penalty ?? 5)} pts
              </dd>
            </div>
          </dl>
        </div>
      )}
    </main>
  );
}
