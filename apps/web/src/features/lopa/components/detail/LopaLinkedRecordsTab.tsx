'use client';

import { useState } from 'react';
import { useLopaLinkedRecordMutations, useLopaLinkedRecords } from '../../hooks/useLopaLinkedRecords';
import type { LopaLinkedRecordFilters } from '../../types/lopa-linked-record.types';
import { AddLinkedRecordDialog } from '../linked-records/AddLinkedRecordDialog';
import { DependencyImpactPanel } from '../linked-records/DependencyImpactPanel';
import { LinkedRecordBulkActions } from '../linked-records/LinkedRecordBulkActions';
import { LinkedRecordDetailDrawer } from '../linked-records/LinkedRecordDetailDrawer';
import { LinkedRecordFilters } from '../linked-records/LinkedRecordFilters';
import { LinkEvidencePanel } from '../linked-records/LinkEvidencePanel';
import { LinkedRecordsRegister } from '../linked-records/LinkedRecordsRegister';
import { LinkedRecordsRelationshipMap } from '../linked-records/LinkedRecordsRelationshipMap';
import { LinkedRecordsSummaryCards } from '../linked-records/LinkedRecordsSummaryCards';
import { LopaLinkedRecordsHeader } from '../linked-records/LopaLinkedRecordsHeader';
import { RequiredMissingLinksPanel } from '../linked-records/RequiredMissingLinksPanel';
import { SourceSnapshotChangeDetectionPanel } from '../linked-records/SourceSnapshotChangeDetectionPanel';

const emptyLink = {
  sourceModule: '',
  recordType: '',
  sourceRecordId: '',
  relationshipType: 'Reference',
  impactLevel: 'Medium',
  required: false,
  blocking: false
};

export function LopaLinkedRecordsTab({ id }: { id: string }) {
  const [filters, setFilters] = useState<LopaLinkedRecordFilters>({});
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyLink);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [compareResult, setCompareResult] = useState<any>(null);
  const query = useLopaLinkedRecords(id, filters);
  const mutations = useLopaLinkedRecordMutations(id);
  const data = query.data;

  if (query.isLoading) return <State text="Loading LOPA linked records..." />;
  if (query.isError) return <State text="Unable to load linked records. Check permission or API status." tone="error" />;
  if (!data) return <State text="No linked-record data returned." />;

  const rows = data.records?.rows ?? [];

  function saveLink() {
    const payload = {
      ...form,
      recordType: form.recordType || form.sourceModule || 'Record',
      sourceRecordId: form.sourceRecordId || form.recordNumber,
      relationshipType: form.relationshipType || 'Reference'
    };
    if (form.id) {
      mutations.update.mutate({ linkId: form.id, values: payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      mutations.create.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  }

  function compare(row: any) {
    mutations.compare.mutate(row.id, { onSuccess: setCompareResult });
  }

  return (
    <section className="space-y-4">
      <LopaLinkedRecordsHeader readOnly={data.readOnly} onAdd={() => { setForm(emptyLink); setDialogOpen(true); }} onSyncAll={() => mutations.syncAll.mutate()} onExport={() => mutations.export.mutate(filters)} syncing={mutations.syncAll.isPending} />
      <LinkedRecordsSummaryCards summary={data.summary ?? {}} />
      <LinkedRecordFilters filters={filters} setFilters={setFilters} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_.9fr]">
        <div className="space-y-4">
          <LinkedRecordsRelationshipMap relationshipMap={data.relationshipMap ?? []} />
          <div className="rounded-xl border border-cyan-300/10 bg-[#071525] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-black text-white">Linked Records Register</h3>
              <span className="text-xs text-slate-500">{data.records?.total ?? rows.length} records</span>
            </div>
            <LinkedRecordsRegister rows={rows} onOpen={setSelected} onSync={(row) => mutations.sync.mutate(row.id)} onRemove={(row) => mutations.remove.mutate({ linkId: row.id, reason: 'Removed from LOPA linked records tab.' })} />
          </div>
          <LinkedRecordBulkActions selectedCount={0} onSyncAll={() => mutations.syncAll.mutate()} onExport={() => mutations.export.mutate(filters)} />
          {compareResult ? <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">Source comparison loaded: {compareResult.changed ? 'source changed from snapshot' : 'snapshot is current'}.</div> : null}
        </div>
        <div className="space-y-4">
          <RequiredMissingLinksPanel required={data.required} />
          <SourceSnapshotChangeDetectionPanel records={rows} />
          <DependencyImpactPanel dependencies={data.dependencies ?? []} />
          <LinkEvidencePanel evidence={data.evidence ?? []} />
        </div>
      </div>
      {mutations.create.isError || mutations.update.isError || mutations.remove.isError || mutations.sync.isError ? <State text="Linked-record mutation failed. Check required fields, permissions, or backend validation." tone="error" /> : null}
      <AddLinkedRecordDialog open={dialogOpen} onClose={() => setDialogOpen(false)} form={form} setForm={setForm} context={data.context ?? {}} onSave={saveLink} saving={mutations.create.isPending || mutations.update.isPending} />
      <LinkedRecordDetailDrawer row={selected} onClose={() => setSelected(null)} onSync={(row) => mutations.sync.mutate(row.id)} onCompare={compare} />
    </section>
  );
}

function State({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'error' }) {
  return <div className={`rounded-xl border p-4 text-sm ${tone === 'error' ? 'border-red-400/20 bg-red-500/10 text-red-100' : 'border-cyan-300/10 bg-[#071525] text-slate-400'}`}>{text}</div>;
}
