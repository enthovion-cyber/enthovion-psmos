'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useCompetencyDetail, useCompetencyLibraryMutations } from '../hooks/useCompetencyLibrary';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { CompetencyHeader } from './CompetencyHeader';
import { Field, Select, Toggle } from './sections/formControls';

const categories = ['Process Safety', 'Operations', 'Maintenance', 'Mechanical Integrity', 'Emergency Response', 'PTW', 'MOC', 'PSSR', 'Leadership', 'Other'];
const levels = ['Aware', 'Trained', 'Competent', 'Qualified', 'Assessor', 'Expert'];

export function CompetencyFormPage({ competencyId }: { competencyId?: string }) {
  const router = useRouter();
  const detail = useCompetencyDetail(competencyId);
  const save = useCompetencyLibraryMutations(competencyId);
  const [form, setForm] = useState<Record<string, any>>({ default_required_level: 'Competent', category: '', active: true });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (detail.data) setForm({ ...detail.data });
  }, [detail.data]);

  const disabledReason = useMemo(() => {
    if (!String(form.competency_code ?? '').trim()) return 'Competency code is required.';
    if (!String(form.competency_name ?? '').trim()) return 'Competency name is required.';
    if (!String(form.category ?? '').trim()) return 'Competency category is required.';
    return '';
  }, [form]);

  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (disabledReason) {
      setError(disabledReason);
      return;
    }
    setError(null);
    save.mutate(form, {
      onSuccess: (row: any) => router.push(`/training-competency/roles-competency-profiles/competencies/${row.id ?? competencyId}`),
      onError: (err: any) => setError(err?.response?.data?.message ?? err?.message ?? 'Unable to save competency.')
    });
  };

  if (competencyId && detail.isLoading) return <TrainingLoadingState rows={4} />;
  if (detail.isError) return <TrainingErrorState message={(detail.error as Error)?.message ?? 'Unable to load competency.'} onRetry={() => detail.refetch()} />;

  return (
    <form onSubmit={submit} className="space-y-5">
      <CompetencyHeader
        title={competencyId ? 'Edit Competency' : 'Create Competency'}
        subtitle="Reusable competency library item used by role profiles, evidence rules, matrix sync, PTW/MOC/PSSR blockers, and worker gap calculations."
        actions={<><TrainingButton href="/training-competency/roles-competency-profiles/competencies" variant="secondary">Cancel</TrainingButton><TrainingButton type="submit" disabled={Boolean(disabledReason) || save.isPending} title={disabledReason || 'Saving competency'}>{save.isPending ? 'Saving...' : 'Save Competency'}</TrainingButton></>}
      />
      {error ? <TrainingErrorState message={error} /> : null}
      <TrainingCard title="Competency Identity" subtitle="Backend validates uniqueness, tenant/site scope, and audit/history for every change.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Competency code" value={form.competency_code ?? form.competencyCode} onChange={(value) => set('competency_code', value)} />
          <Field label="Competency name" value={form.competency_name ?? form.competencyName} onChange={(value) => set('competency_name', value)} />
          <Select label="Category" value={form.category} values={categories} onChange={(value) => set('category', value)} />
          <Select label="Default required level" value={form.default_required_level ?? form.defaultRequiredLevel} values={levels} onChange={(value) => set('default_required_level', value)} />
          <label className="md:col-span-2 text-sm font-semibold">Description<textarea className="mt-1 min-h-28 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={form.description ?? ''} onChange={(event) => set('description', event.target.value)} /></label>
        </div>
      </TrainingCard>
      <TrainingCard title="Default Evidence And Criticality" subtitle="These defaults seed profile requirements without silently crediting worker competency evidence.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Evidence rule / basis" value={form.default_evidence_rule_json ?? form.defaultEvidenceRuleJson} onChange={(value) => set('default_evidence_rule_json', value)} />
          <Field label="Renewal interval days" type="number" value={form.renewal_interval_days_default ?? form.renewalIntervalDaysDefault} onChange={(value) => set('renewal_interval_days_default', value ? Number(value) : '')} />
          <Field label="Linked training reference" value={form.linked_training_reference_id ?? form.linkedTrainingReferenceId} onChange={(value) => set('linked_training_reference_id', value)} />
          <Field label="Linked SOP / procedure" value={form.linked_sop_id ?? form.linkedSopId} onChange={(value) => set('linked_sop_id', value)} />
          <Toggle label="Safety-critical default" checked={Boolean(form.safety_critical_default ?? form.safetyCriticalDefault)} onChange={(value) => set('safety_critical_default', value)} />
          <Toggle label="PSM-critical default" checked={Boolean(form.psm_critical_default ?? form.psmCriticalDefault)} onChange={(value) => set('psm_critical_default', value)} />
          <Toggle label="PTW-critical default" checked={Boolean(form.ptw_critical_default ?? form.ptwCriticalDefault)} onChange={(value) => set('ptw_critical_default', value)} />
          <Toggle label="Active" checked={form.active !== false} onChange={(value) => set('active', value)} />
        </div>
      </TrainingCard>
    </form>
  );
}
