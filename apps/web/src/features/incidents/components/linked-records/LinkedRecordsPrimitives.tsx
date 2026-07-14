'use client';

import { Badge } from '../shared/IncidentStatusBadge';
import { Field, InfoRows, ReadinessContent, SelectField, SummaryCardGrid, TabPanel, TextArea, TimelineList, ToggleGrid, buttonSecondary, formatDate } from '../shared/IncidentTabPrimitives';
import { LinkedRecordStatusBadge } from '../shared/LinkedRecordStatusBadge';
import { LinkedRecordTypeBadge } from '../shared/LinkedRecordTypeBadge';
import { RecordImpactBadge } from '../shared/RecordImpactBadge';
import { RelationshipBadge } from '../shared/RelationshipBadge';

export function LinkedRecordCards({ cards }: { cards: any[] }) { return <SummaryCardGrid cards={cards ?? []} />; }

export function LinkedRecordSimplePanel({ title, data, empty = 'No backend records were returned for this panel.' }: { title: string; data: any; empty?: string }) {
  const rows = Array.isArray(data) ? data : data?.rows ?? [];
  return <TabPanel title={title}>
    <div className="grid gap-3">
      {data?.status ? <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Backend status</span><Badge value={data.status} /></div> : null}
      {data?.warning ? <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-200">{data.warning}</div> : null}
      <TimelineList rows={rows} empty={empty} columns />
    </div>
  </TabPanel>;
}

export function LinkedRecordHeaderFacts({ header }: { header: any }) {
  return <InfoRows rows={[
    ['Incident', `${header?.incidentNumber ?? '-'} - ${header?.incidentTitle ?? '-'}`],
    ['Status / Priority', `${header?.incidentStatus ?? '-'} / ${header?.investigationPriority ?? '-'}`],
    ['PSM/PSE/API tier', header?.psmPseApiTier],
    ['Linked / Missing / Broken', `${header?.totalLinkedRecords ?? 0} / ${header?.requiredLinksMissing ?? 0} / ${header?.brokenLinks ?? 0}`],
    ['Update / Restricted / Actions', `${header?.recordsNeedingUpdate ?? 0} / ${header?.restrictedLinkedRecords ?? 0} / ${header?.linkedActionsCount ?? 0}`],
    ['Review / Last updated', `${header?.reviewStatus ?? '-'} / ${formatDate(header?.lastUpdated)}`]
  ]} />;
}

export function LinkedRecordsTable({ rows, onEdit, onDelete, onRefresh, onImpact, onFollowup }: any) {
  if (!rows?.length) return <p className="text-xs text-slate-500">No linked records yet. Add a link or auto-detect related records from real incident modules.</p>;
  return <div className="overflow-x-auto">
    <table className="min-w-[1500px] text-left text-xs">
      <thead className="text-[11px] uppercase text-slate-500"><tr>{['Link', 'Module / Type', 'Record', 'Relationship', 'Source / Generated', 'Status', 'Impact', 'Owner / Due', 'Restricted', 'Linked / Refreshed', 'Actions'].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead>
      <tbody>{rows.map((row: any) => <tr key={row.id} className="border-t border-slate-200 align-top dark:border-cyan-300/10">
        <td className="p-2 font-bold">{row.link_number}</td>
        <td className="p-2"><div>{row.module}</div><LinkedRecordTypeBadge value={row.record_type} /></td>
        <td className="p-2"><b>{row.record_number_snapshot ?? row.record_id ?? '-'}</b><p className="max-w-[260px] text-slate-500">{row.record_title_snapshot}</p></td>
        <td className="p-2"><RelationshipBadge value={row.relationship} /></td>
        <td className="p-2">{row.source_generated_type}</td>
        <td className="p-2"><LinkedRecordStatusBadge value={row.link_status} /></td>
        <td className="p-2"><RecordImpactBadge value={row.impact_status} />{row.update_required ? <div className="mt-1 text-amber-600">Update required</div> : null}</td>
        <td className="p-2">{row.owner_id ?? '-'}<div className="text-slate-500">{row.due_date ?? '-'}</div></td>
        <td className="p-2">{row.restricted ? 'Yes' : 'No'}</td>
        <td className="p-2">{formatDate(row.linked_at)}<div className="text-slate-500">{formatDate(row.last_refreshed_at)}</div></td>
        <td className="p-2"><div className="flex min-w-[260px] flex-wrap gap-1">
          <button className={buttonSecondary} onClick={() => row.record_id ? window.alert(`Open record ${row.record_id}`) : undefined}>Open</button>
          <button className={buttonSecondary} onClick={() => onEdit?.(row)}>Edit</button>
          <button className={buttonSecondary} onClick={() => onRefresh?.(row)}>Refresh</button>
          <button className={buttonSecondary} onClick={() => onImpact?.(row)}>Impact</button>
          <button className={buttonSecondary} onClick={() => onFollowup?.(row)}>Action</button>
          <button className={buttonSecondary} onClick={() => onDelete?.(row)}>Unlink</button>
        </div></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export function LinkedRecordDrawerForm({ form, set, context }: any) {
  return <div className="grid gap-3 md:grid-cols-2">
    <SelectField label="Module" value={form.module} options={context?.modules ?? ['Equipment Registry', 'Document Control', 'Other']} onChange={(value) => set('module', value)} />
    <SelectField label="Record type" value={form.recordType} options={context?.recordTypes ?? ['Equipment', 'Document / procedure', 'Other']} onChange={(value) => set('recordType', value)} />
    <Field label="Search/select record ID" value={form.recordId} onChange={(value) => set('recordId', value)} />
    <Field label="Record number snapshot" value={form.recordNumberSnapshot} onChange={(value) => set('recordNumberSnapshot', value)} />
    <Field label="Record title snapshot" value={form.recordTitleSnapshot} onChange={(value) => set('recordTitleSnapshot', value)} wide />
    <SelectField label="Relationship" value={form.relationship} options={context?.relationships ?? ['Related record', 'Source record', 'Generated from incident']} onChange={(value) => set('relationship', value)} />
    <Field label="Source / generated flag" value={form.sourceGeneratedType} onChange={(value) => set('sourceGeneratedType', value)} />
    <Field label="Owner" value={form.ownerId} onChange={(value) => set('ownerId', value)} />
    <Field label="Due date" value={form.dueDate} type="date" onChange={(value) => set('dueDate', value)} />
    <SelectField label="Link status" value={form.linkStatus} options={context?.linkStatuses ?? ['Active', 'Needs update', 'Broken', 'Stale']} onChange={(value) => set('linkStatus', value)} />
    <SelectField label="Impact type" value={form.impactStatus} options={context?.impactTypes ?? ['No change required', 'Review required']} onChange={(value) => set('impactStatus', value)} />
    <Field label="Universal Action ID" value={form.universalActionId} onChange={(value) => set('universalActionId', value)} />
    <TextArea className="md:col-span-2" label="Reason for link / notes" value={form.notes ?? form.linkReason} onChange={(value) => { set('notes', value); set('linkReason', value); }} />
    <TextArea className="md:col-span-2" label="Change reason" value={form.changeReason} onChange={(value) => set('changeReason', value)} />
    <div className="md:col-span-2"><ToggleGrid form={form} set={set} keys={[[ 'updateRequired', 'Update required' ], [ 'restricted', 'Restricted inherited' ], [ 'blocking', 'Blocking link' ]]} /></div>
  </div>;
}

export function LinkedRecordReadinessContent({ readiness }: { readiness: any }) { return <ReadinessContent readiness={readiness} />; }
