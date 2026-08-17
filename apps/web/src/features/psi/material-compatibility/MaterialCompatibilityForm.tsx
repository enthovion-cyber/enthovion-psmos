'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { materialCompatibilitySchema } from '../schemas/material-compatibility.schema';
import { useMaterialCompatibilityLookups } from '../hooks/useMaterialCompatibility';
import { useMaterialCompatibilityMutations } from '../hooks/useMaterialCompatibilityMutations';
import { PsiButton, PsiCard, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import type { MaterialCompatibilityDetail } from '../types/material-compatibility.types';
import { ChemicalServiceConditionsSection } from './sections/ChemicalServiceConditionsSection';
import { CompatibilityEvidenceSection } from './sections/CompatibilityEvidenceSection';
import { CompatibilityIdentitySection } from './sections/CompatibilityIdentitySection';
import { CompatibilityRatingSection } from './sections/CompatibilityRatingSection';
import { ControlsRestrictionsSection } from './sections/ControlsRestrictionsSection';
import { DegradationMechanismsSection } from './sections/DegradationMechanismsSection';
import { MaterialComponentDetailsSection } from './sections/MaterialComponentDetailsSection';

export function MaterialCompatibilityForm({ initial, compatibilityId, forcedUnitId }: { initial?: MaterialCompatibilityDetail | undefined; compatibilityId?: string | undefined; forcedUnitId?: string | undefined }) {
  const router = useRouter();
  const lookups = useMaterialCompatibilityLookups();
  const mutations = useMaterialCompatibilityMutations(compatibilityId, forcedUnitId);
  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState<Record<string, any>>(() => ({ compatibility_status: 'Draft', review_status: 'Not Submitted', safety_critical: false, psm_critical: false, unit_id: forcedUnitId ?? '', ...(initial?.compatibility ?? {}) }));
  const [service, setService] = useState<Record<string, any>>(() => ({ ...(initial?.serviceConditions ?? {}) }));
  const [material, setMaterial] = useState<Record<string, any>>(() => ({ ...(initial?.materialDetails ?? {}) }));
  const [rating, setRating] = useState<Record<string, any>>(() => ({ compatibility_rating: initial?.compatibility.compatibility_rating ?? 'Unknown / Needs Data', rating_confidence: initial?.compatibility.rating_confidence ?? 'Unknown', ...(initial?.rating ?? {}) }));
  const [controls, setControls] = useState<Record<string, any>>(() => ({ ...(initial?.controls ?? {}) }));
  const [mechanismDraft, setMechanismDraft] = useState<Record<string, any>>({ risk_level: 'Unknown' });
  const [documentDraft, setDocumentDraft] = useState<Record<string, any>>({ document_type: 'Material compatibility chart', required_evidence: true });

  const payload = useMemo(() => ({
    ...identity,
    unit_id: forcedUnitId ?? identity.unit_id,
    ...service,
    ...material,
    ...rating,
    ...controls,
    degradationMechanisms: compatibilityId ? [] : mechanismDraft.mechanism_type ? [mechanismDraft] : [],
    ...(compatibilityId ? {} : documentDraft.document_id ? documentDraft : {})
  }), [compatibilityId, controls, documentDraft, forcedUnitId, identity, material, mechanismDraft, rating, service]);

  const validation = materialCompatibilitySchema.safeParse(payload);
  const disabledReason = !validation.success ? validation.error.issues.map((issue) => issue.message).join(' ') : undefined;
  const saving = mutations.create.isPending || mutations.update.isPending || mutations.addDegradationMechanism.isPending || mutations.linkDocument.isPending;

  async function save() {
    setError(null);
    if (!validation.success) {
      setError(disabledReason ?? 'Required material compatibility fields are missing.');
      return;
    }
    try {
      const result = compatibilityId ? await mutations.update.mutateAsync(payload) : await mutations.create.mutateAsync(payload);
      router.push(`/process-safety-information/material-compatibility/${result.compatibility.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save material compatibility record.');
    }
  }

  async function addMechanism() {
    if (!compatibilityId || !mechanismDraft.mechanism_type) return;
    await mutations.addDegradationMechanism.mutateAsync(mechanismDraft);
    setMechanismDraft({ risk_level: 'Unknown' });
  }

  async function linkDocument() {
    if (!compatibilityId || !documentDraft.document_id) return;
    await mutations.linkDocument.mutateAsync(documentDraft);
    setDocumentDraft({ document_type: 'Material compatibility chart', required_evidence: true });
  }

  if (lookups.isLoading) return <PsiLoadingState rows={6} />;
  if (lookups.isError) return <PsiErrorState message={lookups.error.message} onRetry={() => void lookups.refetch()} />;
  if (!lookups.data) return null;

  return (
    <div className="space-y-5">
      <PsiCard title={compatibilityId ? 'Edit Material Compatibility' : 'Create Material Compatibility'} subtitle="Complete the PDF-required workflow. Compatibility, conflict, completeness, MOC/PSSR, MI readiness, audit, and PSI history are generated by the backend.">
        <div className="flex flex-wrap gap-2">{['1 Identity', '2 Chemical / Service', '3 Material / Component', '4 Rating', '5 Degradation', '6 Controls', '7 Evidence', '8 Review'].map((step) => <span key={step} className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1 text-xs font-semibold">{step}</span>)}</div>
      </PsiCard>
      {error ? <PsiErrorState message={error} /> : null}
      <CompatibilityIdentitySection value={identity} lookups={lookups.data} forcedUnitId={forcedUnitId} onChange={(patch) => setIdentity((current) => ({ ...current, ...patch }))} />
      <ChemicalServiceConditionsSection value={service} lookups={lookups.data} onChange={(patch) => setService((current) => ({ ...current, ...patch }))} />
      <MaterialComponentDetailsSection value={material} lookups={lookups.data} onChange={(patch) => setMaterial((current) => ({ ...current, ...patch }))} />
      <CompatibilityRatingSection value={rating} lookups={lookups.data} onChange={(patch) => setRating((current) => ({ ...current, ...patch }))} />
      <DegradationMechanismsSection existing={initial?.degradationMechanisms ?? []} draft={mechanismDraft} lookups={lookups.data} onDraftChange={(patch) => setMechanismDraft((current) => ({ ...current, ...patch }))} onAdd={compatibilityId ? () => void addMechanism() : undefined} busy={saving} />
      <ControlsRestrictionsSection value={controls} onChange={(patch) => setControls((current) => ({ ...current, ...patch }))} />
      <CompatibilityEvidenceSection documents={initial?.documents ?? []} draft={documentDraft} lookups={lookups.data} onDraftChange={(patch) => setDocumentDraft((current) => ({ ...current, ...patch }))} onAdd={compatibilityId ? () => void linkDocument() : undefined} busy={saving} />
      <PsiCard title="8. Review & Save" subtitle="Disabled reasons are shown from frontend validation; backend still enforces tenant/site isolation, permissions, review status, conflict rules, and history.">
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[var(--psm-muted)]">{disabledReason ?? 'Ready to save. Run compatibility, completeness, and conflict checks after saving or from the detail header.'}</p><div className="flex gap-2"><PsiButton variant="secondary" onClick={() => router.back()}>Cancel</PsiButton><PsiButton onClick={() => void save()} disabled={saving || Boolean(disabledReason)} title={saving ? 'Saving material compatibility record.' : disabledReason}>{saving ? 'Saving...' : compatibilityId ? 'Save Changes' : 'Create Record'}</PsiButton></div></div>
      </PsiCard>
    </div>
  );
}
