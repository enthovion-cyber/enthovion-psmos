'use client';

import { useState } from 'react';
import { useInitiatingEventLibrary, useLopaLibraryMutations } from '../../../hooks/useLopaLibraries';
import type { InitiatingEventLibraryRecord, LibraryFilters } from '../../../types/lopa-library.types';
import { LopaLibraryHeader } from '../LopaLibraryHeader';
import { LopaLibraryNavigation } from '../LopaLibraryNavigation';
import { AddEditInitiatingEventDialog } from './AddEditInitiatingEventDialog';
import { InitiatingEventDetailDrawer } from './InitiatingEventDetailDrawer';
import { InitiatingEventFilters } from './InitiatingEventFilters';
import { InitiatingEventLibraryTable } from './InitiatingEventLibraryTable';
import { InitiatingEventSummaryCards } from './InitiatingEventSummaryCards';

export function InitiatingEventLibraryPage() {
  const [filters, setFilters] = useState<LibraryFilters>({ page: 1, limit: 50 });
  const [editing, setEditing] = useState<InitiatingEventLibraryRecord | null>(null);
  const [viewing, setViewing] = useState<InitiatingEventLibraryRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { summary, register } = useInitiatingEventLibrary(filters);
  const mutations = useLopaLibraryMutations('initiating');
  const save = async (values: Record<string, any>) => {
    try {
      if (editing) await mutations.update.mutateAsync({ id: editing.id, values });
      else await mutations.create.mutateAsync(values);
      setMessage(editing ? 'Initiating event updated.' : 'Initiating event created.');
      setDialogOpen(false);
      setEditing(null);
    } catch {
      setMessage(null);
    }
  };
  const action = async (record: InitiatingEventLibraryRecord, actionName: 'submit-review' | 'approve' | 'reject' | 'create-revision' | 'archive') => {
    const reason = actionName === 'reject' || actionName === 'archive' ? window.prompt('Enter reason / justification') || undefined : undefined;
    const variables: { id: string; action: typeof actionName; reason?: string } = { id: record.id, action: actionName };
    if (reason) variables.reason = reason;
    const result = await mutations.action.mutateAsync(variables);
    setMessage(actionName === 'create-revision' ? 'Revision created.' : `Library action completed: ${actionName}.`);
    if (actionName === 'create-revision') {
      setEditing(result as InitiatingEventLibraryRecord);
      setDialogOpen(true);
    }
  };
  return (
    <main className="space-y-4 pb-8 text-slate-100">
      <LopaLibraryHeader
        title="Initiating Event Library"
        subtitle="Approved, source-controlled initiating event frequencies for governed LOPA studies. Values are configurable and snapshotted when used."
        onRefresh={() => register.refetch()}
        onNew={() => { setEditing(null); setDialogOpen(true); }}
      />
      <LopaLibraryNavigation active="initiating" />
      {message ? <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-200">{message}</div> : null}
      {summary.isError || register.isError ? <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">Unable to load initiating event library from API.</div> : null}
      <InitiatingEventSummaryCards summary={summary.data} onFilter={(key) => setFilters({ ...filters, page: 1, quick: key })} />
      <InitiatingEventFilters filters={filters} onChange={setFilters} />
      <InitiatingEventLibraryTable
        data={register.data}
        isLoading={register.isLoading}
        onView={setViewing}
        onEdit={(record) => { setEditing(record); setDialogOpen(true); }}
        onAction={action}
      />
      <AddEditInitiatingEventDialog open={dialogOpen} record={editing} onClose={() => { setDialogOpen(false); setEditing(null); }} onSave={save} isSaving={mutations.create.isPending || mutations.update.isPending} error={mutations.create.error || mutations.update.error} />
      <InitiatingEventDetailDrawer record={viewing} onClose={() => setViewing(null)} />
    </main>
  );
}
