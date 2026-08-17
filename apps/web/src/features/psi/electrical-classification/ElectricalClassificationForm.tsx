'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { electricalClassificationSchema } from '../schemas/electrical-classification.schema';
import { useElectricalLookups } from '../hooks/useElectricalClassifications';
import { useElectricalClassificationMutations } from '../hooks/useElectricalClassificationMutations';
import { PsiButton, PsiCard, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import type { ElectricalDetail } from '../types/electrical-classification.types';
import { AreaClassificationSection } from './sections/AreaClassificationSection';
import { ClassificationIdentitySection } from './sections/ClassificationIdentitySection';
import { ElectricalClassificationDocumentsSection } from './sections/ElectricalClassificationDocumentsSection';
import { HazardousMaterialReleaseSourceSection } from './sections/HazardousMaterialReleaseSourceSection';
import { InstalledEquipmentRatingSection } from './sections/InstalledEquipmentRatingSection';
import { ProtectionRequirementsSection } from './sections/ProtectionRequirementsSection';
import { PtwIgnitionControlsSection } from './sections/PtwIgnitionControlsSection';
import { VentilationExtentBasisSection } from './sections/VentilationExtentBasisSection';

export function ElectricalClassificationForm({ initial, classificationId, forcedUnitId }: { initial?: ElectricalDetail | undefined; classificationId?: string | undefined; forcedUnitId?: string | undefined }) {
  const router = useRouter();
  const lookups = useElectricalLookups();
  const mutations = useElectricalClassificationMutations(classificationId, forcedUnitId);
  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState<Record<string, any>>(() => ({ classification_status: 'Draft', classification_system: 'IEC Zone', critical_area: false, psm_critical: false, hot_work_restricted: false, unit_id: forcedUnitId ?? '', ...(initial?.classification ?? {}) }));
  const [hazard, setHazard] = useState<Record<string, any>>(() => ({ ...(initial?.hazardSource ?? {}) }));
  const [area, setArea] = useState<Record<string, any>>(() => ({ ...(initial?.areaDetails ?? {}) }));
  const [ventilation, setVentilation] = useState<Record<string, any>>(() => ({ ...(initial?.ventilationBasis ?? {}) }));
  const [protection, setProtection] = useState<Record<string, any>>(() => ({ ...(initial?.protectionRequirements ?? {}) }));
  const [ptw, setPtw] = useState<Record<string, any>>(() => ({ hot_work_restricted: initial?.classification.hot_work_restricted ?? false, ...(initial?.ptwControls ?? {}) }));
  const [equipmentDraft, setEquipmentDraft] = useState<Record<string, any>>({ suitability_result: 'Needs Review', action_required: false });
  const [documentsDraft, setDocumentsDraft] = useState<Record<string, any>>({ document_type: 'Hazardous area classification drawing', required: true });

  const payload = useMemo(() => ({
    ...identity,
    unit_id: forcedUnitId ?? identity.unit_id,
    ...hazard,
    ...area,
    ...ventilation,
    ...protection,
    ...ptw,
    installedEquipment: classificationId ? [] : equipmentDraft.tag_number ? [equipmentDraft] : [],
    ...(classificationId ? {} : documentsDraft.document_id ? documentsDraft : {})
  }), [area, classificationId, documentsDraft, equipmentDraft, forcedUnitId, hazard, identity, protection, ptw, ventilation]);

  const validation = electricalClassificationSchema.safeParse(payload);
  const disabledReason = !validation.success ? validation.error.issues.map((issue) => issue.message).join(' ') : undefined;
  const saving = mutations.create.isPending || mutations.update.isPending || mutations.addInstalledEquipment.isPending || mutations.linkDocument.isPending;

  async function save() {
    setError(null);
    if (!validation.success) {
      setError(disabledReason ?? 'Required electrical classification fields are missing.');
      return;
    }
    try {
      const result = classificationId ? await mutations.update.mutateAsync(payload) : await mutations.create.mutateAsync(payload);
      router.push(`/process-safety-information/electrical-classification/${result.classification.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save electrical classification.');
    }
  }

  async function addEquipment() {
    if (!classificationId || !equipmentDraft.tag_number) return;
    await mutations.addInstalledEquipment.mutateAsync(equipmentDraft);
    setEquipmentDraft({ suitability_result: 'Needs Review', action_required: false });
  }

  async function linkDocument() {
    if (!classificationId || !documentsDraft.document_id) return;
    await mutations.linkDocument.mutateAsync(documentsDraft);
    setDocumentsDraft({ document_type: 'Hazardous area classification drawing', required: true });
  }

  if (lookups.isLoading) return <PsiLoadingState rows={6} />;
  if (lookups.isError) return <PsiErrorState message={lookups.error.message} onRetry={() => void lookups.refetch()} />;
  if (!lookups.data) return null;

  return (
    <div className="space-y-5">
      <PsiCard title={classificationId ? 'Edit Electrical Classification' : 'Create Electrical Classification'} subtitle="Complete the PDF-required workflow: identity, material/source, area classification, ventilation basis, Ex requirements, installed equipment rating, documents, PTW controls, and review.">
        <div className="flex flex-wrap gap-2">{['1 Identity', '2 Material / Release', '3 Area', '4 Ventilation', '5 Protection', '6 Equipment Rating', '7 Documents', '8 PTW Controls', '9 Review'].map((step) => <span key={step} className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1 text-xs font-semibold">{step}</span>)}</div>
      </PsiCard>
      {error ? <PsiErrorState message={error} /> : null}
      <ClassificationIdentitySection value={identity} lookups={lookups.data} forcedUnitId={forcedUnitId} onChange={(patch) => setIdentity((current) => ({ ...current, ...patch }))} />
      <HazardousMaterialReleaseSourceSection value={hazard} lookups={lookups.data} onChange={(patch) => setHazard((current) => ({ ...current, ...patch }))} />
      <AreaClassificationSection value={area} lookups={lookups.data} onChange={(patch) => setArea((current) => ({ ...current, ...patch }))} />
      <VentilationExtentBasisSection value={ventilation} lookups={lookups.data} onChange={(patch) => setVentilation((current) => ({ ...current, ...patch }))} />
      <ProtectionRequirementsSection value={protection} lookups={lookups.data} onChange={(patch) => setProtection((current) => ({ ...current, ...patch }))} />
      <InstalledEquipmentRatingSection value={initial?.installedEquipment ?? []} draft={equipmentDraft} onDraftChange={(patch) => setEquipmentDraft((current) => ({ ...current, ...patch }))} onAdd={classificationId ? () => void addEquipment() : undefined} busy={saving} />
      <ElectricalClassificationDocumentsSection value={initial?.documents ?? []} lookups={lookups.data} draft={documentsDraft} onDraftChange={(patch) => setDocumentsDraft((current) => ({ ...current, ...patch }))} onAdd={classificationId ? () => void linkDocument() : undefined} busy={saving} />
      <PtwIgnitionControlsSection value={ptw} onChange={(patch) => setPtw((current) => ({ ...current, ...patch }))} />
      <PsiCard title="9. Review & Save" subtitle="Backend enforces company/site isolation, unit/site scope, read-only approved records, rating checks, conflict checks, completeness, audit, and PSI history events.">
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[var(--psm-muted)]">{disabledReason ?? 'Ready to save. Rating, completeness, and conflict status will be generated by the backend.'}</p><div className="flex gap-2"><PsiButton variant="secondary" onClick={() => router.back()}>Cancel</PsiButton><PsiButton onClick={() => void save()} disabled={saving || Boolean(disabledReason)} title={saving ? 'Saving electrical classification.' : disabledReason}>{saving ? 'Saving...' : classificationId ? 'Save Changes' : 'Create Classification'}</PsiButton></div></div>
      </PsiCard>
    </div>
  );
}
