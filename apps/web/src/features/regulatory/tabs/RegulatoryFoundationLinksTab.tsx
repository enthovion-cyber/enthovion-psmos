'use client';

import { useState } from 'react';
import type { RegulatoryDetail } from '../types/regulatory.types';
import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass, formatRegulatoryError } from '../shared/RegulatoryUi';
import { useRegulatoryLinks } from '../hooks/useRegulatoryLinks';
import { useRegulatoryItemMutations } from '../hooks/useRegulatoryItemMutations';

export function RegulatoryFoundationLinksTab({ detail, module }: { detail?: RegulatoryDetail | undefined; module?: string | undefined }) {
  const item = detail?.item;
  const links = useRegulatoryLinks(item?.id);
  const mutations = useRegulatoryItemMutations(item?.id);
  const [form, setForm] = useState<Record<string, unknown>>({ link_module: module ?? 'Audit', link_status: 'Active' });
  const disabled = detail?.readOnly || !item?.id;
  async function save() {
    try {
      await mutations.link.mutateAsync(form);
      setForm({ link_module: module ?? 'Audit', link_status: 'Active' });
    } catch (error) {
      window.alert(formatRegulatoryError(error));
    }
  }
  return (
    <div className="space-y-5">
      <RegulatoryCard title="Linked Records Foundation" subtitle="Document Control, audit mapping, evidence, and action links are stored as backend link records with snapshots.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <RegulatoryField label="Module"><input className={regulatoryInputClass()} value={String(form.link_module ?? '')} onChange={(event) => setForm({ ...form, link_module: event.target.value })} /></RegulatoryField>
          <RegulatoryField label="Record ID"><input className={regulatoryInputClass()} value={String(form.linked_record_id ?? '')} onChange={(event) => setForm({ ...form, linked_record_id: event.target.value })} /></RegulatoryField>
          <RegulatoryField label="Record title"><input className={regulatoryInputClass()} value={String(form.linked_record_title ?? '')} onChange={(event) => setForm({ ...form, linked_record_title: event.target.value })} /></RegulatoryField>
          <RegulatoryField label="Link rationale"><input className={regulatoryInputClass()} value={String(form.link_rationale ?? '')} onChange={(event) => setForm({ ...form, link_rationale: event.target.value })} /></RegulatoryField>
        </div>
        <div className="mt-4"><RegulatoryButton disabled={disabled || mutations.link.isPending || !form.linked_record_id} title={disabled ? detail?.readOnlyReason ?? 'No item loaded.' : !form.linked_record_id ? 'Linked record ID is required.' : 'Create backend link.'} onClick={() => void save()}>Link Record</RegulatoryButton></div>
      </RegulatoryCard>
      <RegulatoryCard title="Current Links" subtitle="Only real linked records returned by the backend are shown.">
        {links.data?.rows?.length ? <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm"><thead className="text-[var(--psm-muted)]"><tr><th className="p-2">Module</th><th className="p-2">Record</th><th className="p-2">Title</th><th className="p-2">Status</th><th className="p-2">Rationale</th></tr></thead><tbody>{links.data.rows.map((row, index) => <tr key={String(row.id ?? index)} className="border-t border-[var(--psm-line)]"><td className="p-2">{String(row.link_module ?? '-')}</td><td className="p-2">{String(row.linked_record_number ?? row.linked_record_id ?? '-')}</td><td className="p-2">{String(row.linked_record_title ?? '-')}</td><td className="p-2">{String(row.link_status ?? '-')}</td><td className="p-2">{String(row.link_rationale ?? '-')}</td></tr>)}</tbody></table></div> : <p className="text-sm text-[var(--psm-muted)]">No linked records are attached yet.</p>}
      </RegulatoryCard>
    </div>
  );
}
