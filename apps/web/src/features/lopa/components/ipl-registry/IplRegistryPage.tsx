'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useIplRegistry, useIplRegistryMutations } from '../../hooks/useIplRegistry';
import { lopaIplRegistryService } from '../../services/lopa-ipl-registry.service';
import type { IplRegistryFilters, IplRegistryRecord } from '../../types/lopa-ipl-registry.types';
import { AddEditIplRegistryDialog } from './AddEditIplRegistryDialog';
import { IplRegistryDetailDrawer } from './IplRegistryDetailDrawer';
import { IplRegistryFilters as IplRegistryFilterBar } from './IplRegistryFilters';
import { IplRegistryHeader } from './IplRegistryHeader';
import { IplRegistrySummaryCards } from './IplRegistrySummaryCards';
import { IplRegistryTable } from './IplRegistryTable';

export function IplRegistryPage() {
  const [filters, setFilters] = useState<IplRegistryFilters>({ page: 1, limit: 25 });
  const [editing, setEditing] = useState<IplRegistryRecord | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { context, summary, register } = useIplRegistry(filters);
  const mutations = useIplRegistryMutations();
  const detail = useQuery({ queryKey: ['lopa', 'ipl-registry', 'detail', viewingId], queryFn: () => lopaIplRegistryService.detail(viewingId as string), enabled: !!viewingId });

  const save = async (values: Record<string, any>) => {
    if (editing) await mutations.update.mutateAsync({ id: editing.id, values });
    else await mutations.create.mutateAsync(values);
    setMessage(editing ? 'IPL registry record updated.' : 'IPL registry record created.');
    setDialogOpen(false);
    setEditing(null);
  };

  const action = async (record: IplRegistryRecord, actionName: 'submit-review' | 'approve' | 'reject' | 'create-revision' | 'archive' | 'restore' | 'duplicate') => {
    const needsReason = ['reject', 'archive', 'restore', 'create-revision', 'duplicate'].includes(actionName);
    const reason = needsReason ? window.prompt('Enter reason / justification') || undefined : undefined;
    const variables: { id: string; action: typeof actionName; reason?: string } = { id: record.id, action: actionName };
    if (reason) variables.reason = reason;
    const result = await mutations.action.mutateAsync(variables);
    setMessage(actionName === 'create-revision' ? 'New controlled revision created.' : `IPL registry action completed: ${actionName}.`);
    if (actionName === 'create-revision') {
      setEditing(result as IplRegistryRecord);
      setDialogOpen(true);
    }
  };

  return (
    <main className="space-y-4 pb-8 text-slate-100">
      <style jsx global>{`
        .lopa-button-primary { display:inline-flex; align-items:center; gap:.45rem; border-radius:.55rem; background:#2563eb; padding:.58rem .85rem; font-size:.82rem; font-weight:700; color:white; box-shadow:0 18px 40px rgba(37,99,235,.18); }
        .lopa-button-secondary { display:inline-flex; align-items:center; gap:.45rem; border-radius:.55rem; border:1px solid rgba(103,232,249,.14); background:rgba(15,35,58,.9); padding:.55rem .8rem; font-size:.82rem; font-weight:700; color:#dbeafe; }
      `}</style>
      <IplRegistryHeader
        onRefresh={() => { void register.refetch(); void summary.refetch(); }}
        onNew={() => { setEditing(null); setDialogOpen(true); }}
        onExport={async () => { await lopaIplRegistryService.export(filters); setMessage('IPL registry export prepared from real filtered data.'); }}
      />
      {message ? <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-200">{message}</div> : null}
      {summary.isError || register.isError ? <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">Unable to load IPL Registry from API.</div> : null}
      <IplRegistrySummaryCards summary={summary.data} onFilter={(quick) => setFilters(quick ? { ...filters, quick, page: 1 } : { ...filters, page: 1 })} />
      <IplRegistryFilterBar filters={filters} context={context.data} onChange={setFilters} />
      <IplRegistryTable
        data={register.data}
        isLoading={register.isLoading}
        onView={(record) => setViewingId(record.id)}
        onEdit={(record) => { setEditing(record); setDialogOpen(true); }}
        onAction={action}
      />
      <AddEditIplRegistryDialog
        open={dialogOpen}
        record={editing}
        context={context.data}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSave={save}
        isSaving={mutations.create.isPending || mutations.update.isPending}
        error={mutations.create.error || mutations.update.error}
      />
      <IplRegistryDetailDrawer record={detail.data ?? null} onClose={() => setViewingId(null)} />
      {detail.isFetching && viewingId ? <div className="fixed bottom-4 right-4 rounded-lg border border-cyan-300/10 bg-[#071525] px-4 py-2 text-sm text-slate-300 shadow-xl">Loading IPL detail...</div> : null}
      {mutations.action.error ? <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{mutations.action.error.message}</div> : null}
    </main>
  );
}
