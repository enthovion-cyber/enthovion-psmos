'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateDeviationDraft } from '../schemas/deviation.schema';
import { useDeficiencyLookups } from '../hooks/useDeficiencies';
import { useDeviationDetail, useDeviationMutations } from '../hooks/useDeviations';
import { ActionButton, PrimaryButton, SectionCard } from '../safeguards/SafeguardUiPrimitives';
import { Check, Input, Select } from '../deficiencies/DeficiencyFormSections';

export function DeviationFormPage({ deviationId, preset = {} }: { deviationId?: string | undefined; preset?: Record<string, unknown> }) {
  const router = useRouter();
  const lookups = useDeficiencyLookups();
  const detail = useDeviationDetail(deviationId);
  const row = detail.data?.deviation;
  const [values, setValues] = useState<Record<string, any>>({
    equipmentId: row?.equipment_id ?? preset.equipmentId ?? '',
    title: row?.title ?? '',
    description: row?.description ?? '',
    deviationType: row?.deviation_type ?? '',
    requirementReference: row?.requirement_reference ?? '',
    normalRequirement: row?.normal_requirement ?? '',
    requestedDeviation: row?.requested_deviation ?? '',
    reason: row?.reason ?? '',
    riskAssessment: row?.risk_assessment_json ?? row?.risk_assessment_summary ?? '',
    temporaryControls: row?.temporary_controls_json ?? row?.temporary_controls ?? '',
    startDate: row?.start_date ?? '',
    expiryDate: row?.expiry_date ?? '',
    extensionAllowed: row?.extension_allowed ?? false,
    extensionLimitValue: row?.extension_limit_value ?? row?.max_extension_days ?? '',
    extensionLimitUnit: row?.extension_limit_unit ?? 'days',
    ownerUserId: row?.owner_user_id ?? '',
    approverUserId: row?.approver_user_id ?? '',
    closureRequirement: row?.closure_requirement ?? ''
  });
  const [error, setError] = useState<string | null>(null);
  const mutations = useDeviationMutations(row?.id);
  const change = (key: string, value: unknown) => setValues((current) => ({ ...current, [key]: value }));
  const save = async () => {
    const missing = validateDeviationDraft(values);
    if (missing.length) {
      setError(`Missing required fields: ${missing.join(', ')}`);
      return;
    }
    setError(null);
    const result = row?.id ? await mutations.update.mutateAsync(values) : await mutations.create.mutateAsync(values);
    router.push(`/mechanical-integrity/deviations/${result.deviation.id}`);
  };
  return (
    <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <header><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Mechanical Integrity</p><h1 className="mt-1 text-2xl font-bold">{deviationId ? 'Edit Deviation' : 'Create Deviation'}</h1></header>
      {error ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div> : null}
      <SectionCard title="Deviation Details" description="Temporary deviation request, normal requirement, risk basis, controls, dates, owner, approver, and closure requirements.">
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={values.equipmentId} onChange={(value) => change('equipmentId', value)} placeholder="Equipment ID" />
          <Select value={values.deviationType} onChange={(value) => change('deviationType', value)} options={lookups.data?.deviationTypes} placeholder="Deviation type" />
          <Input value={values.title} onChange={(value) => change('title', value)} placeholder="Title" />
          <Input value={values.requirementReference} onChange={(value) => change('requirementReference', value)} placeholder="Requirement reference" />
          <Input value={values.normalRequirement} onChange={(value) => change('normalRequirement', value)} placeholder="Normal requirement" />
          <Input value={values.requestedDeviation} onChange={(value) => change('requestedDeviation', value)} placeholder="Requested deviation" />
          <Input value={values.reason} onChange={(value) => change('reason', value)} placeholder="Reason" />
          <Input value={values.riskAssessment} onChange={(value) => change('riskAssessment', value)} placeholder="Risk assessment" />
          <Input value={values.temporaryControls} onChange={(value) => change('temporaryControls', value)} placeholder="Temporary controls" />
          <Input type="date" value={values.startDate} onChange={(value) => change('startDate', value)} />
          <Input type="date" value={values.expiryDate} onChange={(value) => change('expiryDate', value)} />
          <Input value={values.extensionLimitValue} onChange={(value) => change('extensionLimitValue', value)} placeholder="Maximum extension" />
          <Input value={values.extensionLimitUnit} onChange={(value) => change('extensionLimitUnit', value)} placeholder="Extension unit" />
          <Input value={values.ownerUserId} onChange={(value) => change('ownerUserId', value)} placeholder="Owner user ID" />
          <Input value={values.approverUserId} onChange={(value) => change('approverUserId', value)} placeholder="Approver user ID" />
          <Input value={values.closureRequirement} onChange={(value) => change('closureRequirement', value)} placeholder="Closure requirement" />
        </div>
        <div className="mt-3"><Check label="Extension allowed" checked={values.extensionAllowed} onChange={(value) => change('extensionAllowed', value)} /></div>
      </SectionCard>
      <div className="flex flex-wrap gap-2"><PrimaryButton type="submit" disabled={mutations.create.isPending || mutations.update.isPending}>Save Deviation</PrimaryButton><ActionButton onClick={() => router.push('/mechanical-integrity/deviations')}>Cancel</ActionButton></div>
    </form>
  );
}
