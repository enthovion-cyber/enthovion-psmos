'use client';

import { useState } from 'react';
import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { AuditButton, AuditEmptyState, AuditErrorState, AuditLoadingState } from '../shared/AuditUi';
import { useAuditLookups } from '../hooks/useAuditLookups';
import { useAuditProgramMutations } from '../hooks/useAuditProgramMutations';
import { useAuditPrograms } from '../hooks/useAuditPrograms';
import type { AuditProgram } from '../types/audit.types';
import { AuditSummaryCards } from '../dashboard/AuditSummaryCards';
import { AuditProgramFilters } from './AuditProgramFilters';
import { AuditProgramMobileCards } from './AuditProgramMobileCards';
import { AuditProgramTable } from './AuditProgramTable';

export function AuditProgramRegisterPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const query = useAuditPrograms(filters);
  const lookups = useAuditLookups();
  const actions = useAuditProgramMutations();
  const rows = query.data?.rows ?? [];
  const mutateFor = (row: AuditProgram, action: 'activate' | 'reactivate' | 'submitReview') => {
    actions[action].mutate(row.id);
  };
  const archive = (row: AuditProgram) => {
    const reason = window.prompt('Archive reason is required');
    if (reason) {
      actions.archive.mutate({ id: row.id, reason });
    }
  };
  return (
    <AuditLayout>
      <div className="space-y-6">
        <AuditHeader title="Audit Program Register" />
          <AuditProgramFilters filters={filters} setFilters={setFilters} lookups={lookups.data} />
        {query.isLoading ? <AuditLoadingState rows={8} /> : null}
        {query.isError ? <AuditErrorState message={query.error} onRetry={() => query.refetch()} /> : null}
        {!query.isLoading && !query.isError ? <>
          <AuditSummaryCards summary={query.data?.summary ?? {}} />
          {!rows.length ? <AuditEmptyState title="No audit programs match" message="No backend audit program rows matched the current filters." action={<AuditButton href="/audit-compliance/programs/new">Create Audit Program</AuditButton>} /> : null}
          <AuditProgramTable rows={rows} onArchive={archive} onActivate={(row) => mutateFor(row, 'activate')} onReactivate={(row) => mutateFor(row, 'reactivate')} onSubmitReview={(row) => mutateFor(row, 'submitReview')} />
          <AuditProgramMobileCards rows={rows} />
        </> : null}
      </div>
    </AuditLayout>
  );
}
