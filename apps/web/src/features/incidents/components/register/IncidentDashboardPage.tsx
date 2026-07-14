'use client';

import { useState } from 'react';
import { useIncidentBulkActions } from '../../hooks/useIncidentBulkActions';
import { useIncidentExport } from '../../hooks/useIncidentExport';
import { useIncidentFilters } from '../../hooks/useIncidentFilters';
import { useIncidentRegister } from '../../hooks/useIncidentRegister';
import { useIncidentSavedViews } from '../../hooks/useIncidentSavedViews';
import { CorrectiveActionSnapshotPanel } from './CorrectiveActionSnapshotPanel';
import { CriticalAttentionPanel } from './CriticalAttentionPanel';
import { HighPotentialNearMissPanel } from './HighPotentialNearMissPanel';
import { IncidentAdvancedFilters } from './IncidentAdvancedFilters';
import { IncidentBulkActions } from './IncidentBulkActions';
import { IncidentDashboardHeader } from './IncidentDashboardHeader';
import { IncidentExportActions } from './IncidentExportActions';
import { IncidentRegisterTable } from './IncidentRegisterTable';
import { IncidentSavedViews } from './IncidentSavedViews';
import { IncidentSummaryCards } from './IncidentSummaryCards';
import { IncidentTrendSnapshotPanel } from './IncidentTrendSnapshotPanel';
import { InvestigationStatusPanel } from './InvestigationStatusPanel';
import { PsmEventPanel } from './PsmEventPanel';

export function IncidentDashboardPage() {
  const { filters, setFilters } = useIncidentFilters();
  const query = useIncidentRegister(filters);
  const savedViews = useIncidentSavedViews();
  const bulk = useIncidentBulkActions();
  const exports = useIncidentExport();

  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // 1. Core State Handlers
  if (query.isLoading) {
    return <State text="Loading incident dashboard/register from API..." />;
  }

  if (query.isError) {
    return (
      <State
        tone="error"
        text="Unable to load Incident Register. Check incidents.register.view permission, API availability, and database migration."
      />
    );
  }

  // FIX: Explicitly handle the edge case where data hasn't arrived or is empty
  if (!query.data) {
    return <State text="No incident records found." />;
  }

  const data = query.data;

  const busy =
    bulk.update.isPending ||
    bulk.assign.isPending ||
    bulk.createAction.isPending ||
    exports.register.isPending ||
    exports.psm.isPending ||
    exports.highPotential.isPending ||
    exports.overdue.isPending;

  const exportKind = (kind: string) => {
    const map: any = {
      register: exports.register,
      psm: exports.psm,
      highPotential: exports.highPotential,
      overdue: exports.overdue,
    };

    map[kind].mutate(filters, {
      onSuccess: (r: any) =>
        setNotice(
          `${r.fileName} generated with ${String(r.content ?? '').split('\n').length - 1} rows.`
        ),
      onError: (e: any) => setNotice(e.message ?? 'Export failed'),
    });
  };

  return (
    <main className="space-y-4 pb-8 text-slate-900 dark:text-slate-100">
      <style jsx global>{`
        .lopa-button-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          border-radius: 0.55rem;
          background: #2563eb;
          padding: 0.58rem 0.85rem;
          font-size: 0.82rem;
          font-weight: 700;
          color: white;
        }
        .lopa-button-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          border-radius: 0.55rem;
          border: 1px solid rgba(103, 232, 249, 0.18);
          padding: 0.55rem 0.8rem;
          font-size: 0.82rem;
          font-weight: 700;
          color: inherit;
        }
      `}</style>

      {notice ? (
        <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-3 text-sm">
          {notice}
        </div>
      ) : null}

      <IncidentDashboardHeader
        header={data.header}
        permissions={data.permissions}
        isFetching={query.isFetching}
        onRefresh={() => void query.refetch()}
        onExport={() => exportKind('register')}
      />

      <IncidentSummaryCards
        cards={data.summary?.cards ?? []}
        onFilter={(f) => setFilters({ ...filters, ...f, page: 1 })}
      />

      <IncidentAdvancedFilters
        filters={filters}
        context={data.filterContext}
        setFilters={setFilters}
      />

      <IncidentSavedViews
        views={data.savedViews ?? []}
        canSave={!!data.permissions?.canView}
        onApply={(f) => setFilters({ ...filters, ...f, page: 1 })}
        onSave={() => {
          const viewName = prompt('View name');
          if (viewName) {
            savedViews.save.mutate(
              { viewName, filters, visibility: 'Private' },
              { onSuccess: () => setNotice('Saved view created.') }
            );
          }
        }}
      />

      {/* Responsive Grid Layout */}
      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <CriticalAttentionPanel data={data.attention} />
        <PsmEventPanel data={data.psmEvents} />
        <HighPotentialNearMissPanel data={data.highPotential} />
        <InvestigationStatusPanel
          data={data.investigationStatus}
          onFilter={(f) => setFilters({ ...filters, ...f, page: 1 })}
        />
        <CorrectiveActionSnapshotPanel data={data.actionSnapshot} />
        <IncidentTrendSnapshotPanel data={data.trends} />
      </div>

      <IncidentBulkActions
        selected={selected}
        users={data.filterContext?.users ?? []}
        permissions={data.permissions}
        busy={busy}
        onAssign={(owner, reason) =>
          bulk.assign.mutate(
            { ids: selected, investigationOwnerId: owner, reason },
            {
              onSuccess: () => {
                setNotice('Owner assignment complete.');
                setSelected([]);
              },
            }
          )
        }
        onUpdate={(patch) =>
          bulk.update.mutate(
            { ids: selected, ...patch },
            {
              onSuccess: () => {
                setNotice('Bulk update complete.');
                setSelected([]);
              },
            }
          )
        }
      />

      <IncidentExportActions
        canExport={!!data.permissions?.canExport}
        busy={busy}
        onExport={exportKind}
      />

      <IncidentRegisterTable
        register={data.register}
        selected={selected}
        setSelected={setSelected}
        setFilters={setFilters}
      />
    </main>
  );
}

function State({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'error' }) {
  return (
    <main
      className={`rounded-xl border p-6 text-sm ${
        tone === 'error'
          ? 'border-red-400/20 bg-red-500/10 text-red-700 dark:text-red-100'
          : 'border-cyan-300/10 bg-[#071525] text-slate-400'
      }`}
    >
      {text}
    </main>
  );
}