'use client';

import { useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import { useHazopLinkedRecordMutations } from '../../hooks/useHazopLinkedRecordMutations';
import { useHazopLinkedRecords } from '../../hooks/useHazopLinkedRecords';
import type { HazopLinkedRecord, HazopLinkedRecordBlocker, HazopLinkedRecordFilters as FilterState } from '../../types/hazop-linked-record.types';
import { AddLinkedRecordDialog } from '../linked-records/AddLinkedRecordDialog';
import { HazopEquipmentDocumentLinkPanel } from '../linked-records/HazopEquipmentDocumentLinkPanel';
import { HazopLinkedRecordBlockerPanel } from '../linked-records/HazopLinkedRecordBlockerPanel';
import { HazopLinkedRecordDetailDrawer } from '../linked-records/HazopLinkedRecordDetailDrawer';
import { HazopLinkedRecordFilters } from '../linked-records/HazopLinkedRecordFilters';
import { HazopLinkedRecordsRegister } from '../linked-records/HazopLinkedRecordsRegister';
import { HazopLinkedRecordsSummaryCards } from '../linked-records/HazopLinkedRecordsSummaryCards';
import { HazopMocPssrLopaLinkPanel } from '../linked-records/HazopMocPssrLopaLinkPanel';
import { HazopRelatedActionsPanel } from '../linked-records/HazopRelatedActionsPanel';

export function HazopLinkedRecordsTab({ study }: { study: any }) {
  const permissions = useMyPermissions().data ?? [];
  const can = (permission: string) => permissions.includes(permission) || permissions.includes('hazop:manage');
  const readonly = ['Approved', 'Closed', 'Cancelled'].includes(study.status);
  const [filters, setFilters] = useState<FilterState>({ module: 'All', relationshipType: 'All', blockingStatus: 'All' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<HazopLinkedRecord | null>(null);
  const linked = useHazopLinkedRecords(study.id, filters);
  const mutations = useHazopLinkedRecordMutations(study.id);
  const records = linked.records.data ?? [];
  const blockers = linked.blockers.data ?? [];

  if (!can('hazop.linked_records.view')) return <StateCard tone="red" title="Permission denied" text="You do not have permission to view HAZOP linked records." />;
  const exportRegister = async () => {
    const file = await mutations.exportRegister.mutateAsync();
    const blob = new Blob([file.content], { type: file.contentType ?? 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.fileName ?? `${study.study_number}-linked-records.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const resolveBlocker = (blocker: HazopLinkedRecordBlocker) => {
    const reason = window.prompt('Resolution note');
    if (reason === null) return;
    mutations.resolveBlocker.mutate({ linkId: blocker.linked_record_id ?? blocker.id, blockerId: blocker.id, values: { reason } });
  };
  return (
    <div className="space-y-5">
      {readonly ? <StateCard tone="amber" title="Read-only study" text="Linked record relationships are locked until the study is re-opened by an authorized user." /> : null}
      {linked.records.isError ? <StateCard tone="red" title="Unable to load linked records" text="Check HAZOP linked-record migrations and permissions." /> : null}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><h2 className="text-xl font-semibold">Linked Records</h2><p className="text-sm text-[var(--psm-muted)]">MOC, PSSR, PTW, equipment, document, action, LOPA and previous-study dependencies with closure blockers.</p></div>
        <div className="flex flex-wrap gap-2">
          {can('hazop.linked_records.export') ? <button onClick={exportRegister} className="inline-flex items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold"><Download size={15} /> Export</button> : null}
          {can('hazop.linked_records.create') && !readonly ? <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"><Plus size={15} /> Add Link</button> : null}
        </div>
      </div>
      <HazopLinkedRecordsSummaryCards summary={linked.summary.data} onFilter={(key) => key === 'openBlockers' ? setFilters((current) => ({ ...current, blockingStatus: 'Blocking' })) : undefined} />
      <HazopLinkedRecordFilters filters={filters} context={linked.context.data} onChange={setFilters} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <HazopLinkedRecordsRegister
          records={records}
          readonly={readonly}
          canEdit={can('hazop.linked_records.edit') || can('hazop.linked_records.sync')}
          canDelete={can('hazop.linked_records.delete')}
          onOpen={setSelected}
          onSync={(record) => mutations.sync.mutate(record.id)}
          onDelete={(record) => mutations.delete.mutate({ linkId: record.id, reason: window.prompt('Reason for removing link') ?? undefined })}
          onMarkBlocking={(record) => mutations.markBlocking.mutate({ linkId: record.id, values: { blockingRule: 'Blocks HAZOP closure' } })}
        />
        <div className="space-y-4">
          <HazopLinkedRecordBlockerPanel blockers={blockers} onResolve={can('hazop.linked_records.edit') && !readonly ? resolveBlocker : undefined} />
          <HazopMocPssrLopaLinkPanel records={records} />
          <HazopEquipmentDocumentLinkPanel records={records} />
          <HazopRelatedActionsPanel records={records} />
        </div>
      </div>
      <AddLinkedRecordDialog open={dialogOpen} context={linked.context.data} isSaving={mutations.create.isPending} onClose={() => setDialogOpen(false)} onSave={(values) => mutations.create.mutate(values, { onSuccess: () => setDialogOpen(false) })} />
      <HazopLinkedRecordDetailDrawer record={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function StateCard({ tone, title, text }: { tone: 'red' | 'amber'; title: string; text: string }) {
  const color = tone === 'red' ? 'border-red-500/30 bg-red-500/10 text-red-100' : 'border-amber-500/30 bg-amber-500/10 text-amber-100';
  return <div className={`rounded-xl border p-4 ${color}`}><div className="font-semibold">{title}</div><p className="mt-1 text-sm opacity-80">{text}</p></div>;
}
