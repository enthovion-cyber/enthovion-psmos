'use client';

import { useState } from 'react';
import { useConditionalModifierLibrary, useLopaLibraryMutations } from '../../../hooks/useLopaLibraries';
import type { ConditionalModifierLibraryRecord, LibraryFilters } from '../../../types/lopa-library.types';
import { LopaLibraryHeader } from '../LopaLibraryHeader';
import { LopaLibraryNavigation } from '../LopaLibraryNavigation';
import { AddEditConditionalModifierDialog } from './AddEditConditionalModifierDialog';
import { ConditionalModifierDetailDrawer } from './ConditionalModifierDetailDrawer';
import { ConditionalModifierFilters } from './ConditionalModifierFilters';
import { ConditionalModifierSummaryCards } from './ConditionalModifierSummaryCards';
import { ConditionalModifierTable } from './ConditionalModifierTable';

export function ConditionalModifierLibraryPage() {
  const [filters, setFilters] = useState<LibraryFilters>({ page: 1, limit: 50 });
  const [editing, setEditing] = useState<ConditionalModifierLibraryRecord | null>(null);
  const [viewing, setViewing] = useState<ConditionalModifierLibraryRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { summary, register } = useConditionalModifierLibrary(filters);
  const mutations = useLopaLibraryMutations('modifier');
  const save = async (values: Record<string, any>) => {
    try {
      if (editing) await mutations.update.mutateAsync({ id: editing.id, values });
      else await mutations.create.mutateAsync(values);
      setMessage(editing ? 'Conditional modifier updated.' : 'Conditional modifier created.');
      setDialogOpen(false);
      setEditing(null);
    } catch {
      setMessage(null);
    }
  };
  const action = async (record: ConditionalModifierLibraryRecord, actionName: 'submit-review' | 'approve' | 'reject' | 'create-revision' | 'archive') => {
    const reason = actionName === 'reject' || actionName === 'archive' ? window.prompt('Enter reason / justification') || undefined : undefined;
    const variables: { id: string; action: typeof actionName; reason?: string } = { id: record.id, action: actionName };
    if (reason) variables.reason = reason;
    const result = await mutations.action.mutateAsync(variables);
    setMessage(actionName === 'create-revision' ? 'Revision created.' : `Library action completed: ${actionName}.`);
    if (actionName === 'create-revision') {
      setEditing(result as unknown as ConditionalModifierLibraryRecord);
      setDialogOpen(true);
    }
  };
  return (
    <main className="space-y-4 pb-8 text-slate-100">
      <LopaLibraryHeader
        title="Conditional Modifier Library"
        subtitle="Approved probability, exposure, and enabling-condition factors for LOPA calculations with value ranges and engineering justification controls."
        onRefresh={() => register.refetch()}
        onNew={() => { setEditing(null); setDialogOpen(true); }}
      />
      <LopaLibraryNavigation active="modifier" />
      {message ? <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-200">{message}</div> : null}
      {summary.isError || register.isError ? <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">Unable to load conditional modifier library from API.</div> : null}
      <ConditionalModifierSummaryCards summary={summary.data} onFilter={(key) => setFilters({ ...filters, page: 1, quick: key })} />
      <ConditionalModifierFilters filters={filters} onChange={setFilters} />
      <ConditionalModifierTable
        data={register.data}
        isLoading={register.isLoading}
        onView={setViewing}
        onEdit={(record) => { setEditing(record); setDialogOpen(true); }}
        onAction={action}
      />
      <AddEditConditionalModifierDialog open={dialogOpen} record={editing} onClose={() => { setDialogOpen(false); setEditing(null); }} onSave={save} isSaving={mutations.create.isPending || mutations.update.isPending} error={mutations.create.error || mutations.update.error} />
      <ConditionalModifierDetailDrawer record={viewing} onClose={() => setViewing(null)} />
    </main>
  );
}
