'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReliefSystemLookups } from '../hooks/useReliefSystems';
import { useReliefSystemMutations } from '../hooks/useReliefSystemMutations';
import { reliefSystemSchema } from '../schemas/relief-system.schema';
import { PsiButton, PsiCard, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import type { ReliefSystemDetail } from '../types/relief-system.types';
import { DischargeDestinationSection } from './sections/DischargeDestinationSection';
import { ProtectedEquipmentSection } from './sections/ProtectedEquipmentSection';
import { ReliefBasisIdentitySection } from './sections/ReliefBasisIdentitySection';
import { ReliefDeviceProtectionSection } from './sections/ReliefDeviceProtectionSection';
import { ReliefDocumentsSection } from './sections/ReliefDocumentsSection';
import { ReliefScenariosSection } from './sections/ReliefScenariosSection';
import { SizingCapacityBasisSection } from './sections/SizingCapacityBasisSection';

export function ReliefSystemForm({ initial, reliefBasisId, forcedUnitId }: { initial?: ReliefSystemDetail | undefined; reliefBasisId?: string | undefined; forcedUnitId?: string | undefined }) {
  const router = useRouter();
  const lookups = useReliefSystemLookups();
  const mutations = useReliefSystemMutations(reliefBasisId, forcedUnitId);
  const [error, setError] = useState<string | null>(null);
  const [basis, setBasis] = useState<Record<string, any>>(() => ({
    unit_id: forcedUnitId ?? '',
    status: 'Draft',
    equipment_criticality: 'Medium',
    relief_system_type: '',
    safety_critical: false,
    psm_critical: false,
    ...(initial?.reliefBasis ?? {})
  }));
  const [protectedEquipment, setProtectedEquipment] = useState<Record<string, any>>(() => ({ ...(initial?.protectedEquipment?.[0] ?? {}), ...(initial?.reliefBasis ?? {}) }));
  const [device, setDevice] = useState<Record<string, any>>(() => ({ ...(initial?.deviceLinks?.[0] ?? {}), ...(initial?.reliefBasis ?? {}) }));
  const [scenarios, setScenarios] = useState<Record<string, any>[]>(() => initial?.scenarios?.length ? [...initial.scenarios] : [{ scenario_type: '', scenario_description: '', governing_case: true }]);
  const [sizing, setSizing] = useState<Record<string, any>>(() => ({ ...(initial?.sizingBasis ?? {}), ...(initial?.reliefBasis ?? {}) }));
  const [discharge, setDischarge] = useState<Record<string, any>>(() => ({ ...(initial?.dischargeDestination ?? {}), ...(initial?.reliefBasis ?? {}) }));
  const [documents, setDocuments] = useState<Record<string, any>[]>(() => [...(initial?.documents ?? [])]);

  const payload = useMemo(() => ({
    ...basis,
    ...protectedEquipment,
    ...device,
    ...sizing,
    ...discharge,
    unit_id: forcedUnitId ?? basis.unit_id,
    scenarios,
    sizingBasis: sizing,
    dischargeDestination: discharge,
    protectedEquipment,
    deviceLink: device,
    documentLinks: documents
  }), [basis, device, discharge, documents, forcedUnitId, protectedEquipment, scenarios, sizing]);

  const validation = reliefSystemSchema.safeParse(payload);
  const disabledReason = !validation.success ? validation.error.issues.map((issue) => issue.message).join(' ') : undefined;
  const saving = mutations.create.isPending || mutations.update.isPending;

  async function submit() {
    setError(null);
    if (!validation.success) {
      setError(disabledReason ?? 'Required relief system design basis fields are missing.');
      return;
    }
    try {
      const result = reliefBasisId ? await mutations.update.mutateAsync(payload) : await mutations.create.mutateAsync(payload);
      router.push(`/process-safety-information/relief-systems/${result.reliefBasis.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save relief system design basis.');
    }
  }

  if (lookups.isLoading) return <PsiLoadingState rows={6} />;
  if (lookups.isError) return <PsiErrorState message={lookups.error.message} onRetry={() => void lookups.refetch()} />;

  return (
    <div className="space-y-5">
      <PsiCard title={reliefBasisId ? 'Edit Relief System Design Basis' : 'Create Relief System Design Basis'} subtitle="Complete the PDF-required eight-step relief basis workflow. Backend validation, completeness, conflict checks, MI sync impact, audit, and PSI history run on save/check actions.">
        <div className="flex flex-wrap gap-2">
          {['1 Identity', '2 Protected Equipment', '3 Device / Protection', '4 Scenarios', '5 Sizing', '6 Discharge', '7 Documents', '8 Review'].map((step) => <span key={step} className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1 text-xs font-semibold">{step}</span>)}
        </div>
      </PsiCard>
      {error ? <PsiErrorState message={error} /> : null}
      <ReliefBasisIdentitySection value={basis} lookups={lookups.data} forcedUnitId={forcedUnitId} onChange={(patch) => setBasis((current) => ({ ...current, ...patch }))} />
      <ProtectedEquipmentSection value={protectedEquipment} onChange={(patch) => setProtectedEquipment((current) => ({ ...current, ...patch }))} />
      <ReliefDeviceProtectionSection value={device} lookups={lookups.data} onChange={(patch) => setDevice((current) => ({ ...current, ...patch }))} />
      <ReliefScenariosSection scenarios={scenarios} lookups={lookups.data} onChange={setScenarios} />
      <SizingCapacityBasisSection value={sizing} lookups={lookups.data} onChange={(patch) => setSizing((current) => ({ ...current, ...patch }))} />
      <DischargeDestinationSection value={discharge} lookups={lookups.data} onChange={(patch) => setDischarge((current) => ({ ...current, ...patch }))} />
      <ReliefDocumentsSection documents={documents} lookups={lookups.data} onChange={setDocuments} />
      <PsiCard title="8. Review & Save" subtitle="Saving stores the basis, linked devices, protected equipment, scenarios, sizing, discharge, controlled document snapshots, audit logs, and PSI history.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--psm-muted)]">{disabledReason ?? 'All required PDF fields for initial save are ready.'}</p>
          <div className="flex gap-2">
            <PsiButton variant="secondary" onClick={() => router.back()}>Cancel</PsiButton>
            <PsiButton onClick={() => void submit()} disabled={saving || Boolean(disabledReason)} title={saving ? 'Saving relief system design basis.' : disabledReason}>{saving ? 'Saving...' : reliefBasisId ? 'Save Changes' : 'Create Relief Basis'}</PsiButton>
          </div>
        </div>
      </PsiCard>
    </div>
  );
}
