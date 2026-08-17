'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryField, RegulatoryLoadingState, formatRegulatoryError, regulatoryInputClass } from '../shared/RegulatoryUi';
import { useRegulatoryActionLookups } from '../hooks/useRegulatoryActionLookups';
import { useRegulatoryActionMutations } from '../hooks/useRegulatoryActionMutations';

export function RegulatoryActionFormPage({ mode = 'create', source }: { mode?: 'create' | 'link'; source?: Record<string, string> }) {
  const router = useRouter();
  const lookups = useRegulatoryActionLookups();
  const mutations = useRegulatoryActionMutations();
  const [form, setForm] = useState<Record<string, string>>({
    actionMode: mode === 'link' ? 'Link Existing Universal Action' : 'Create New Universal Action',
    sourceType: source?.sourceType ?? 'Manual Regulatory Action Source',
    sourceRecordId: source?.sourceRecordId ?? '',
    actionTitle: '',
    regulatoryActionType: 'Corrective Action',
    actionPriority: 'Medium',
    dueDate: '',
    ownerUserId: '',
    universalActionId: '',
    auditCapaId: '',
    reason: ''
  });
  const error = mutations.create.error ?? mutations.linkExisting.error;
  const submitting = mutations.create.isPending || mutations.linkExisting.isPending;
  const disabledReason = useMemo(() => {
    if (!(form.actionTitle ?? '').trim()) return 'Action title is required.';
    if ((form.actionMode ?? '').includes('Existing Universal') && !(form.universalActionId ?? '').trim()) return 'Universal Action ID is required.';
    if ((form.actionMode ?? '').includes('Audit CAPA') && !(form.auditCapaId ?? '').trim()) return 'Audit CAPA ID is required.';
    return '';
  }, [form]);
  if (lookups.isLoading) return <RegulatoryLayout current="Create Action"><RegulatoryLoadingState rows={6} /></RegulatoryLayout>;
  if (lookups.isError) return <RegulatoryLayout current="Create Action"><RegulatoryErrorState message={lookups.error} onRetry={() => lookups.refetch()} /></RegulatoryLayout>;
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (disabledReason) return;
    const result = mode === 'link' ? await mutations.linkExisting.mutateAsync(form) : await mutations.create.mutateAsync(form);
    const id = result.actionLink?.id ?? result.row?.id;
    router.push(id ? `/regulatory/actions/links/${id}` : '/regulatory/actions/register');
  };
  return (
    <RegulatoryLayout current={mode === 'link' ? 'Link Existing Action' : 'Create Action'}>
      <form className="space-y-5" onSubmit={submit}>
        <RegulatoryHeader title={mode === 'link' ? 'Link Existing Regulatory Action' : 'Create Regulatory Action'} subtitle="Create or link a real Universal Action Engine / Audit CAPA record to a regulatory source." action={<><RegulatoryButton href="/regulatory/actions" variant="secondary">Cancel</RegulatoryButton><RegulatoryButton type="submit" disabled={Boolean(disabledReason) || submitting} title={disabledReason || undefined}>{submitting ? 'Saving...' : 'Save'}</RegulatoryButton></>} />
        {error ? <RegulatoryCard title="Save failed" subtitle={formatRegulatoryError(error)}><p className="text-sm text-[var(--psm-muted)]">The backend rejected the mutation. Permission, company/site isolation, source validation, and required action rules are enforced server-side.</p></RegulatoryCard> : null}
        <div className="grid gap-5 lg:grid-cols-2">
          <RegulatoryCard title="Action Source" subtitle="Source snapshot is preserved by the backend">
            <div className="grid gap-4">
              <RegulatoryField label="Source type"><select className={regulatoryInputClass()} value={form.sourceType} onChange={(event) => set('sourceType', event.target.value)}>{lookups.data?.sourceTypes.map((item) => <option key={item}>{item}</option>)}</select></RegulatoryField>
              <RegulatoryField label="Source record ID"><input className={regulatoryInputClass()} value={form.sourceRecordId} onChange={(event) => set('sourceRecordId', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Reason / basis"><textarea className={regulatoryInputClass()} value={form.reason} onChange={(event) => set('reason', event.target.value)} /></RegulatoryField>
            </div>
          </RegulatoryCard>
          <RegulatoryCard title="Action / CAPA Link" subtitle="No duplicate action lifecycle is created">
            <div className="grid gap-4">
              <RegulatoryField label="Action title"><input className={regulatoryInputClass()} value={form.actionTitle} onChange={(event) => set('actionTitle', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Action mode"><select className={regulatoryInputClass()} value={form.actionMode} onChange={(event) => set('actionMode', event.target.value)}>{lookups.data?.actionModes.map((item) => <option key={item}>{item}</option>)}</select></RegulatoryField>
              <RegulatoryField label="Action type"><select className={regulatoryInputClass()} value={form.regulatoryActionType} onChange={(event) => set('regulatoryActionType', event.target.value)}>{lookups.data?.actionTypes.map((item) => <option key={item}>{item}</option>)}</select></RegulatoryField>
              <RegulatoryField label="Priority"><select className={regulatoryInputClass()} value={form.actionPriority} onChange={(event) => set('actionPriority', event.target.value)}>{lookups.data?.priorities.map((item) => <option key={item}>{item}</option>)}</select></RegulatoryField>
              <RegulatoryField label="Owner user ID"><input className={regulatoryInputClass()} value={form.ownerUserId} onChange={(event) => set('ownerUserId', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Due date"><input type="date" className={regulatoryInputClass()} value={form.dueDate} onChange={(event) => set('dueDate', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Universal Action ID"><input className={regulatoryInputClass()} value={form.universalActionId} onChange={(event) => set('universalActionId', event.target.value)} /></RegulatoryField>
              <RegulatoryField label="Audit CAPA ID"><input className={regulatoryInputClass()} value={form.auditCapaId} onChange={(event) => set('auditCapaId', event.target.value)} /></RegulatoryField>
            </div>
          </RegulatoryCard>
        </div>
      </form>
    </RegulatoryLayout>
  );
}
