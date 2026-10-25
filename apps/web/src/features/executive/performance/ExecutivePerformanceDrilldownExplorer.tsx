'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveStatusBadge } from '../components/shared/ExecutiveStatusBadge';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import { ChevronRight, Building2, Layers, Cpu, Database, ShieldAlert, Clock, ArrowRight } from 'lucide-react';

const card = 'rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm';
const buttonSecondary = 'inline-flex items-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--psm-text)] transition hover:bg-[var(--psm-surface)]';

export function ExecutivePerformanceDrilldownExplorer() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  const [currentLevel, setCurrentLevel] = useState<'company' | 'site' | 'unit'>('company');
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['executive', 'performance', 'drilldown', currentLevel, selectedSiteId, selectedUnitId],
    queryFn: () =>
      executiveApi.performanceDrilldown({
        scopeType: currentLevel,
        scopeId: currentLevel === 'site' ? selectedSiteId : currentLevel === 'unit' ? selectedUnitId : undefined,
      }),
  });

  const data: any = query.data;

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
          Executive KPI · Phase 3 Hierarchy Navigation
        </p>
        <h1 className="text-2xl font-bold text-[var(--psm-text)]">Scope Drilldown Explorer</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">
          Traverse enterprise hierarchy with continuous permission validation and scope-safe source isolation:
          Company &rarr; Site &rarr; Unit &rarr; Module.
        </p>
      </header>

      {/* Breadcrumb Path */}
      <nav aria-label="Drilldown Path" className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 text-sm">
        <button
          type="button"
          onClick={() => {
            setCurrentLevel('company');
            setSelectedSiteId(null);
            setSelectedUnitId(null);
          }}
          className={`font-semibold transition ${currentLevel === 'company' ? 'text-[var(--psm-primary)]' : 'text-[var(--psm-muted)] hover:text-[var(--psm-text)]'}`}
        >
          Corporate Enterprise
        </button>

        {selectedSiteId && (
          <>
            <ChevronRight size={14} className="text-[var(--psm-muted)]" />
            <button
              type="button"
              onClick={() => {
                setCurrentLevel('site');
                setSelectedUnitId(null);
              }}
              className={`font-semibold transition ${currentLevel === 'site' ? 'text-[var(--psm-primary)]' : 'text-[var(--psm-muted)] hover:text-[var(--psm-text)]'}`}
            >
              Site: {selectedSiteId}
            </button>
          </>
        )}

        {selectedUnitId && (
          <>
            <ChevronRight size={14} className="text-[var(--psm-muted)]" />
            <span className="font-semibold text-[var(--psm-primary)]">
              Unit: {selectedUnitId}
            </span>
          </>
        )}
      </nav>

      {query.isLoading && <div className="h-64 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />}

      {query.isError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-[var(--psm-text)]">
          <p className="font-bold text-rose-700 dark:text-rose-300">Drilldown step unavailable</p>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">You may not have permission to view this scope or the Phase 3 migration is pending.</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Active Scope Summary Card */}
          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--psm-line)] pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-primary)]">
                  Active Scope: {data.scope?.scope_type ?? currentLevel}
                </span>
                <h2 className="text-xl font-bold text-[var(--psm-text)]">
                  {data.scope?.scope_label ?? 'Corporate Scope'}
                </h2>
              </div>
              <ExecutiveStatusBadge status={data.scope?.performance_status ?? 'Healthy'} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
              <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
                <span className="text-[var(--psm-muted)]">Foundation Score</span>
                <p className="mt-1 text-2xl font-bold text-[var(--psm-text)]">
                  {data.scope?.performance_score_foundation ?? '—'} <span className="text-xs font-normal text-[var(--psm-muted)]">/ 100</span>
                </p>
              </div>

              <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
                <span className="text-[var(--psm-muted)]">Critical Open Risks</span>
                <p className="mt-1 text-2xl font-bold text-rose-500">{data.scope?.critical_alert_count ?? 0}</p>
              </div>

              <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
                <span className="text-[var(--psm-muted)]">Overdue Actions</span>
                <p className="mt-1 text-2xl font-bold text-amber-500">{data.scope?.overdue_action_count ?? 0}</p>
              </div>

              <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
                <span className="text-[var(--psm-muted)]">Pending Approvals</span>
                <p className="mt-1 text-2xl font-bold text-[var(--psm-text)]">{data.scope?.pending_approval_count ?? 0}</p>
              </div>

              <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
                <span className="text-[var(--psm-muted)]">Stale Critical Records</span>
                <p className="mt-1 text-2xl font-bold text-[var(--psm-text)]">{data.scope?.stale_record_count ?? 0}</p>
              </div>
            </div>
          </section>

          {/* Child Scopes to Drill Into */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-[var(--psm-text)]">
              Next Drilldown Level ({data.children?.length ?? 0} Child Scopes)
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(data.children ?? []).map((child: any) => (
                <div
                  key={child.id}
                  className={`${card} flex flex-col justify-between transition hover:border-[var(--psm-primary)]`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                        {child.scopeType}
                      </span>
                      <Building2 size={15} className="text-[var(--psm-primary)]" />
                    </div>
                    <h4 className="mt-2 text-base font-bold text-[var(--psm-text)]">{child.label}</h4>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--psm-line)]">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentLevel === 'company') {
                          setSelectedSiteId(child.id);
                          setCurrentLevel('site');
                        } else if (currentLevel === 'site') {
                          setSelectedUnitId(child.id);
                          setCurrentLevel('unit');
                        }
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--psm-primary)] hover:underline"
                    >
                      <span>Drill Deeper</span>
                      <ArrowRight size={13} />
                    </button>
                    {child.route && (
                      <Link href={child.route} className={buttonSecondary}>
                        Open Cockpit
                      </Link>
                    )}
                  </div>
                </div>
              ))}

              {!data.children?.length && (
                <div className={`${card} col-span-full py-8 text-center text-xs text-[var(--psm-muted)]`}>
                  Terminal level reached or no lower child scopes are configured for this hierarchy branch.
                </div>
              )}
            </div>
          </section>

          {/* Source Trace Preview */}
          {data.sourceTrace?.length > 0 && (
            <section className={card}>
              <h3 className="text-sm font-bold text-[var(--psm-text)]">Scoped Source Trace Records</h3>
              <p className="mt-0.5 text-xs text-[var(--psm-muted)]">Verified evidence records contributing to this hierarchy level.</p>
              <div className="mt-3 max-h-60 overflow-auto text-xs font-mono rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
                <pre>{JSON.stringify(data.sourceTrace, null, 2)}</pre>
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
