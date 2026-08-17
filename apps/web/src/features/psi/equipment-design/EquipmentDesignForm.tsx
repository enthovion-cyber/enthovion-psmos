'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { equipmentDesignSchema } from '../schemas/equipment-design.schema';
import { PsiButton, PsiCard, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import type { EquipmentDesignDetail } from '../types/equipment-design.types';
import { useEquipmentDesignLookups } from '../hooks/useEquipmentDesignBasis';
import { useEquipmentDesignMutations } from '../hooks/useEquipmentDesignMutations';
import { CapacityPerformanceBasisSection } from './sections/CapacityPerformanceBasisSection';
import { DesignAssumptionsLimitationsSection } from './sections/DesignAssumptionsLimitationsSection';
import { DesignCodesStandardsSection } from './sections/DesignCodesStandardsSection';
import { DesignRatingsSection } from './sections/DesignRatingsSection';
import { EquipmentDesignDocumentsSection } from './sections/EquipmentDesignDocumentsSection';
import { EquipmentIdentitySection } from './sections/EquipmentIdentitySection';
import { MechanicalMaterialBasisSection } from './sections/MechanicalMaterialBasisSection';
import { ServiceOperatingBasisSection } from './sections/ServiceOperatingBasisSection';

const empty = {};

export function EquipmentDesignForm({ initial, designBasisId, forcedUnitId }: { initial?: EquipmentDesignDetail | undefined; designBasisId?: string | undefined; forcedUnitId?: string | undefined }) {
  const router = useRouter();
  const lookups = useEquipmentDesignLookups();
  const mutations = useEquipmentDesignMutations(designBasisId, forcedUnitId);
  const [error, setError] = useState<string | null>(null);
  const [basis, setBasis] = useState<Record<string, any>>(() => ({
    status: 'Draft',
    equipment_criticality: 'Medium',
    unit_id: forcedUnitId ?? '',
    safety_critical: false,
    psm_critical: false,
    ...(initial?.designBasis ?? {})
  }));
  const [ratings, setRatings] = useState<Record<string, any>>(() => ({ ...(initial?.ratings ?? empty) }));
  const [serviceBasis, setServiceBasis] = useState<Record<string, any>>(() => ({ service_fluid: initial?.designBasis.service_fluid ?? '', fluid_phase: initial?.designBasis.fluid_phase ?? '', ...(initial?.serviceBasis ?? empty) }));
  const [materialBasis, setMaterialBasis] = useState<Record<string, any>>(() => ({ ...(initial?.materialBasis ?? empty) }));
  const [capacityBasis, setCapacityBasis] = useState<Record<string, any>>(() => ({ ...(initial?.capacityBasis ?? empty) }));
  const [codes, setCodes] = useState<Record<string, any>>(() => ({ ...(initial?.codes ?? empty) }));
  const [assumptions, setAssumptions] = useState<Record<string, any>>(() => ({ ...(initial?.assumptions ?? empty) }));
  const [documents, setDocuments] = useState<Record<string, any>[]>(() => [...(initial?.documents ?? [])]);

  const payload = useMemo(() => ({
    ...basis,
    unit_id: forcedUnitId ?? basis.unit_id,
    service_fluid: serviceBasis.service_fluid ?? basis.service_fluid,
    fluid_phase: serviceBasis.fluid_phase ?? basis.fluid_phase,
    ratings,
    serviceBasis,
    materialBasis,
    capacityBasis,
    codes,
    assumptions,
    documentLinks: documents
  }), [assumptions, basis, capacityBasis, codes, documents, forcedUnitId, materialBasis, ratings, serviceBasis]);

  const validation = equipmentDesignSchema.safeParse({ ...payload, ...ratings, ...materialBasis, ...codes });
  const disabledReason = !validation.success ? validation.error.issues.map((issue) => issue.message).join(' ') : undefined;
  const saving = mutations.create.isPending || mutations.update.isPending;

  async function submit() {
    setError(null);
    if (!validation.success) {
      setError(disabledReason ?? 'Required design basis fields are missing.');
      return;
    }
    try {
      const result = designBasisId ? await mutations.update.mutateAsync(payload) : await mutations.create.mutateAsync(payload);
      router.push(`/process-safety-information/equipment-design/${result.designBasis.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save equipment design basis.');
    }
  }

  if (lookups.isLoading) return <PsiLoadingState rows={6} />;
  if (lookups.isError) return <PsiErrorState message={lookups.error.message} onRetry={() => void lookups.refetch()} />;

  return (
    <div className="space-y-5">
      <PsiCard title={designBasisId ? 'Edit Equipment Design Basis' : 'Create Equipment Design Basis'} subtitle="Complete the PDF-required nine-step design basis workflow. Backend validation, completeness, conflict checks, audit, and history run on save.">
        <div className="flex flex-wrap gap-2">
          {['1 Identity', '2 Ratings', '3 Service', '4 Mechanical', '5 Capacity', '6 Codes', '7 Assumptions', '8 Documents', '9 Review'].map((step) => <span key={step} className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1 text-xs font-semibold">{step}</span>)}
        </div>
      </PsiCard>
      {error ? <PsiErrorState message={error} /> : null}
      <EquipmentIdentitySection value={basis} lookups={lookups.data} forcedUnitId={forcedUnitId} onChange={(patch) => setBasis((current) => ({ ...current, ...patch }))} />
      <DesignRatingsSection value={ratings} onChange={(patch) => setRatings((current) => ({ ...current, ...patch }))} />
      <ServiceOperatingBasisSection value={serviceBasis} lookups={lookups.data} onChange={(patch) => setServiceBasis((current) => ({ ...current, ...patch }))} />
      <MechanicalMaterialBasisSection value={materialBasis} lookups={lookups.data} onChange={(patch) => setMaterialBasis((current) => ({ ...current, ...patch }))} />
      <CapacityPerformanceBasisSection value={capacityBasis} onChange={(patch) => setCapacityBasis((current) => ({ ...current, ...patch }))} />
      <DesignCodesStandardsSection value={codes} lookups={lookups.data} onChange={(patch) => setCodes((current) => ({ ...current, ...patch }))} />
      <DesignAssumptionsLimitationsSection value={assumptions} onChange={(patch) => setAssumptions((current) => ({ ...current, ...patch }))} />
      <EquipmentDesignDocumentsSection value={{ documents }} lookups={lookups.data} onChange={(patch) => setDocuments(Array.isArray(patch.documents) ? patch.documents as Record<string, any>[] : documents)} />
      <PsiCard title="9. Review & Save" subtitle="Saving creates/updates the design basis, preserves linked document snapshots, runs completeness and conflict checks, and writes PSI history/audit events.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--psm-muted)]">{disabledReason ?? 'All required PDF fields for initial save are ready.'}</p>
          <div className="flex gap-2">
            <PsiButton variant="secondary" onClick={() => router.back()}>Cancel</PsiButton>
            <PsiButton onClick={() => void submit()} disabled={saving || Boolean(disabledReason)} title={saving ? 'Saving equipment design basis.' : disabledReason}>{saving ? 'Saving...' : designBasisId ? 'Save Changes' : 'Create Design Basis'}</PsiButton>
          </div>
        </div>
      </PsiCard>
    </div>
  );
}
