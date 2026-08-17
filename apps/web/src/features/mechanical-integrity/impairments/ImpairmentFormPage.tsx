'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useImpairmentDetail } from '../hooks/useImpairmentDetail';
import { useImpairmentLookups } from '../hooks/useImpairments';
import { useImpairmentMutations } from '../hooks/useImpairmentMutations';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { ActionButton } from '../safeguards/SafeguardUiPrimitives';
import { ApprovalSection } from './sections/ApprovalSection';
import { DurationExpirySection } from './sections/DurationExpirySection';
import { ImpairmentDetailsSection } from './sections/ImpairmentDetailsSection';
import { LinkedRecordsSection } from './sections/LinkedRecordsSection';
import { ReviewSubmitSection } from './sections/ReviewSubmitSection';
import { RiskMitigationSection } from './sections/RiskMitigationSection';
import { SafeguardSelectionSection } from './sections/SafeguardSelectionSection';

export function ImpairmentFormPage({ impairmentId, preset = {} }: { impairmentId?: string; preset?: Record<string, unknown> }) {
  const router = useRouter();
  const detail = useImpairmentDetail(impairmentId);
  const lookups = useImpairmentLookups();
  const mutations = useImpairmentMutations(impairmentId);
  const initial = useMemo(() => ({
    status: 'Draft',
    impairmentType: 'Bypass',
    riskLevel: 'Medium',
    plannedEmergency: 'Planned',
    startAt: '',
    maxDurationValue: 8,
    maxDurationUnit: 'Hours',
    mitigationRequired: false,
    extensionReasonRequired: true,
    autoCreateActionIfExpired: true,
    ...preset
  }), [preset]);
  const [form, setForm] = useState<Record<string, any>>(initial);
  useEffect(() => {
    if (detail.data?.impairment) {
      const row = detail.data.impairment;
      setForm({
        ...row,
        safeguardType: row.safeguard_type,
        safeguardId: row.safeguard_id,
        safeguardTag: row.safeguard_tag,
        impairmentType: row.impairment_type,
        riskLevel: row.risk_level,
        startAt: row.start_at?.slice(0, 16),
        maxDurationValue: row.max_duration_value,
        maxDurationUnit: row.max_duration_unit,
        reason: row.reason,
        temporaryMitigationSummary: row.temporary_mitigation_summary
      });
    }
  }, [detail.data]);
  if (impairmentId && detail.isLoading) return <MiLoadingSkeleton rows={5} />;
  const saving = mutations.create.isPending || mutations.update.isPending;
  const save = () => {
    const mutation = impairmentId ? mutations.update : mutations.create;
    mutation.mutate(form, {
      onSuccess: (response: any) => {
        const id = response?.impairment?.id ?? impairmentId;
        if (id) router.push(`/mechanical-integrity/bypass-impairments/${id}`);
      }
    });
  };
  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Safeguard Bypass / Impairment</p>
            <h1 className="mt-1 text-2xl font-bold">{impairmentId ? 'Edit Bypass / Impairment' : 'Create Bypass / Impairment'}</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">Seven-step workflow covering safeguard selection, bypass details, risk/mitigation, duration, approvals, linked records, and review.</p>
          </div>
          <ActionButton onClick={() => router.back()}>Back</ActionButton>
        </div>
      </header>
      <SafeguardSelectionSection value={form} lookups={lookups.data} onChange={setForm} />
      <ImpairmentDetailsSection value={form} lookups={lookups.data} onChange={setForm} />
      <RiskMitigationSection value={form} lookups={lookups.data} onChange={setForm} />
      <DurationExpirySection value={form} onChange={setForm} />
      <ApprovalSection value={form} onChange={setForm} />
      <LinkedRecordsSection value={form} onChange={setForm} />
      <ReviewSubmitSection value={form} saving={saving} onSave={save} />
      {mutations.create.isError || mutations.update.isError ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">Save failed. Check required fields, safeguard access, duplicate active bypasses, and backend validation.</div> : null}
    </div>
  );
}
