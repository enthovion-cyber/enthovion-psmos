'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useOpLookups, useOpMutations, useOpRegister } from './hooks/useOperatingProcedures';
import {
  OpBadge,
  OpButton,
  OpCard,
  OpEmpty,
  OpError,
  OpField,
  OpHeader,
  OpLayout,
  OpLoading,
  criticalityTone,
  fmtDate,
  opInput,
  statusTone
} from './shared/OpUi';
import type { OpProcedure } from './types/operating-procedures.types';

export function OpRegisterPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Record<string, any>>({
    page: 1,
    limit: 25,
    sort: 'updated_at.desc',
    status: searchParams.get('status') ?? '',
    typeCode: searchParams.get('typeCode') ?? '',
    criticality: searchParams.get('criticality') ?? '',
    overdue: searchParams.get('overdue') ?? '',
    swp: searchParams.get('swp') ?? '',
    search: searchParams.get('search') ?? ''
  });

  const query = useOpRegister(filters);
  const lookups = useOpLookups();
  const mutations = useOpMutations();

  useEffect(() => {
    const status = searchParams.get('status');
    const overdue = searchParams.get('overdue');
    const swp = searchParams.get('swp');
    if (status || overdue || swp) {
      setFilters((prev) => ({
        ...prev,
        status: status ?? prev.status,
        overdue: overdue ?? prev.overdue,
        swp: swp ?? prev.swp
      }));
    }
  }, [searchParams]);

  if (query.isLoading) {
    return (
      <OpLayout current="Procedure Register">
        <OpLoading rows={8} />
      </OpLayout>
    );
  }

  if (query.isError) {
    return (
      <OpLayout current="Procedure Register">
        <OpError error={query.error} onRetry={() => query.refetch()} />
      </OpLayout>
    );
  }

  const data = query.data;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const limit = data?.limit ?? 25;
  const totalPages = Math.ceil(total / limit) || 1;

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <OpLayout current="Procedure Register">
      <div className="space-y-5">
        <OpHeader
          title="Procedure & Safe Work Practice Register"
          subtitle="Master index of all plant Operating Procedures, Safe Work Practices, emergency responses, and safe operating limit guides."
          actions={
            <div className="flex gap-2">
              <OpButton variant="secondary" onClick={() => query.refetch()}>
                Refresh
              </OpButton>
              <OpButton href="/operating-procedures/new">New Procedure</OpButton>
            </div>
          }
        />

        {/* Filter controls */}
        <OpCard>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <OpField label="Search">
                <input
                  type="text"
                  placeholder="Number, title, or purpose..."
                  className={opInput}
                  value={filters.search ?? ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </OpField>
            </div>
            <div>
              <OpField label="Status">
                <select
                  className={opInput}
                  value={filters.status ?? ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {(lookups.data?.statuses ?? []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </OpField>
            </div>
            <div>
              <OpField label="Procedure Type">
                <select
                  className={opInput}
                  value={filters.typeCode ?? ''}
                  onChange={(e) => handleFilterChange('typeCode', e.target.value)}
                >
                  <option value="">All Types</option>
                  {(lookups.data?.types ?? []).map((t) => (
                    <option key={t.type_code} value={t.type_code}>
                      {t.type_name}
                    </option>
                  ))}
                </select>
              </OpField>
            </div>
            <div>
              <OpField label="Criticality">
                <select
                  className={opInput}
                  value={filters.criticality ?? ''}
                  onChange={(e) => handleFilterChange('criticality', e.target.value)}
                >
                  <option value="">All Levels</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </OpField>
            </div>
            <div>
              <OpField label="Quick Filter">
                <select
                  className={opInput}
                  value={filters.overdue === 'true' ? 'overdue' : filters.swp === 'true' ? 'swp' : ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === 'overdue') {
                      setFilters((prev) => ({ ...prev, overdue: 'true', swp: '', page: 1 }));
                    } else if (v === 'swp') {
                      setFilters((prev) => ({ ...prev, swp: 'true', overdue: '', page: 1 }));
                    } else {
                      setFilters((prev) => ({ ...prev, overdue: '', swp: '', page: 1 }));
                    }
                  }}
                >
                  <option value="">None</option>
                  <option value="overdue">Certification Overdue</option>
                  <option value="swp">Safe Work Practices Only</option>
                </select>
              </OpField>
            </div>
          </div>
        </OpCard>

        {/* Procedures Table */}
        <OpCard>
          {items.length === 0 ? (
            <OpEmpty
              title="No procedures found"
              message="No procedures match the selected filter criteria."
              action={
                <OpButton
                  variant="secondary"
                  onClick={() =>
                    setFilters({ page: 1, limit: 25, sort: 'updated_at.desc', status: '', typeCode: '', criticality: '', overdue: '', swp: '', search: '' })
                  }
                >
                  Reset Filters
                </OpButton>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--psm-line)] text-[var(--psm-muted)]">
                    <th className="py-3 pr-3 font-semibold">Procedure #</th>
                    <th className="py-3 pr-3 font-semibold">Title</th>
                    <th className="py-3 pr-3 font-semibold">Type</th>
                    <th className="py-3 pr-3 font-semibold">Criticality</th>
                    <th className="py-3 pr-3 font-semibold">Status</th>
                    <th className="py-3 pr-3 font-semibold">Annual Cert Status</th>
                    <th className="py-3 pr-3 font-semibold">Next Cert Due</th>
                    <th className="py-3 pr-3 font-semibold">Rev</th>
                    <th className="py-3 pr-3 font-semibold">Updated</th>
                    <th className="py-3 pr-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--psm-line)]">
                  {items.map((proc: OpProcedure) => (
                    <tr key={proc.id} className="hover:bg-[var(--psm-surface-2)]">
                      <td className="py-3 pr-3 font-mono font-semibold text-primary">
                        <Link href={`/operating-procedures/${proc.id}`} className="hover:underline">
                          {proc.procedure_number}
                        </Link>
                      </td>
                      <td className="py-3 pr-3">
                        <Link
                          href={`/operating-procedures/${proc.id}`}
                          className="font-semibold text-[var(--psm-fg)] hover:text-primary"
                        >
                          {proc.title}
                        </Link>
                        {proc.is_safe_work_practice ? (
                          <span className="ml-2 inline-block rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                            SWP
                          </span>
                        ) : null}
                        {proc.is_temporary ? (
                          <span className="ml-1 inline-block rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                            TEMP
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-3 text-[var(--psm-muted)]">{proc.procedure_type_code}</td>
                      <td className="py-3 pr-3">
                        <OpBadge tone={criticalityTone(proc.criticality)}>{proc.criticality}</OpBadge>
                      </td>
                      <td className="py-3 pr-3">
                        <OpBadge tone={statusTone(proc.procedure_status)}>{proc.procedure_status}</OpBadge>
                      </td>
                      <td className="py-3 pr-3">
                        <OpBadge tone={statusTone(proc.certification_status)}>{proc.certification_status}</OpBadge>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={proc.certification_status === 'Overdue' ? 'font-semibold text-danger' : 'text-[var(--psm-muted)]'}>
                          {fmtDate(proc.next_certification_due)}
                        </span>
                      </td>
                      <td className="py-3 pr-3 font-mono text-[var(--psm-muted)]">
                        {proc.current_revision_label ?? 'Draft'}
                      </td>
                      <td className="py-3 pr-3 text-[var(--psm-muted)]">{fmtDate(proc.updated_at)}</td>
                      <td className="py-3 pr-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/operating-procedures/${proc.id}`}
                            className="rounded px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--psm-line)] pt-3 text-xs text-[var(--psm-muted)]">
            <div>
              Showing {items.length} of {total} procedures (Page {page} of {totalPages})
            </div>
            <div className="flex gap-2">
              <OpButton
                variant="secondary"
                disabled={page <= 1}
                onClick={() => handleFilterChange('page', page - 1)}
              >
                Previous
              </OpButton>
              <OpButton
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => handleFilterChange('page', page + 1)}
              >
                Next
              </OpButton>
            </div>
          </div>
        </OpCard>
      </div>
    </OpLayout>
  );
}
