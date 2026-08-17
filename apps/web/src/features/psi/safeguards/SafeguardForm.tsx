'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeguardLookups } from '../hooks/useSafeguards';
import { useSafeguardMutations } from '../hooks/useSafeguardMutations';
import { safeguardSchema } from '../schemas/safeguard.schema';
import { PsiButton, PsiCard, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import type { SafeguardDetail } from '../types/safeguard.types';
import { SafeguardDocumentsEvidenceSection } from './sections/SafeguardDocumentsEvidenceSection';
import { SafeguardEffectivenessIndependenceSection } from './sections/SafeguardEffectivenessIndependenceSection';
import { SafeguardFunctionRequirementsSection } from './sections/SafeguardFunctionRequirementsSection';
import { SafeguardHazardScenarioSection } from './sections/SafeguardHazardScenarioSection';
import { SafeguardIdentitySection } from './sections/SafeguardIdentitySection';
import { SafeguardSourceModuleLinkSection } from './sections/SafeguardSourceModuleLinkSection';
import { SafeguardTestingImpairmentSection } from './sections/SafeguardTestingImpairmentSection';

export function SafeguardForm({ initial, safeguardId, forcedUnitId }: { initial?: SafeguardDetail | undefined; safeguardId?: string | undefined; forcedUnitId?: string | undefined }) {
  const router = useRouter();
  const lookups = useSafeguardLookups();
  const mutations = useSafeguardMutations(safeguardId, forcedUnitId);
  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState<Record<string, any>>(() => ({ status: 'Draft', review_status: 'Draft', safeguard_category: 'Prevention', criticality: 'Medium', safety_critical: false, psm_critical: false, ipl_candidate: false, unit_id: forcedUnitId ?? '', ...(initial?.safeguard ?? {}) }));
  const [hazardDraft, setHazardDraft] = useState<Record<string, any>>({ source_module: 'Manual hazard scenario' });
  const [functionRequirements, setFunctionRequirements] = useState<Record<string, any>>(() => ({ ...(initial?.functionRequirements ?? {}) }));
  const [sourceDraft, setSourceDraft] = useState<Record<string, any>>({ sync_mode: 'Compare only' });
  const [effectiveness, setEffectiveness] = useState<Record<string, any>>(() => ({ effectiveness_status: initial?.effectiveness?.effectiveness_status ?? 'Unknown / Needs Review', ipl_qualification_status: initial?.effectiveness?.ipl_qualification_status ?? 'Not IPL', ...(initial?.effectiveness ?? {}) }));
  const [testing, setTesting] = useState<Record<string, any>>(() => ({ test_status: initial?.testingStatus?.test_status ?? 'Unknown', ...(initial?.testingStatus ?? {}) }));
  const [documentDraft, setDocumentDraft] = useState<Record<string, any>>({ document_type: 'Safeguard design basis', relationship_type: 'Evidence', required: true, readiness_impact: true });

  const payload = useMemo(() => ({ ...identity, unit_id: forcedUnitId ?? identity.unit_id, ...functionRequirements, ...effectiveness, ...testing, hazardLinks: safeguardId ? [] : hazardDraft.scenario_title ? [hazardDraft] : [], sourceLinks: safeguardId ? [] : sourceDraft.linked_module ? [sourceDraft] : [], ...(safeguardId ? {} : documentDraft.document_id ? documentDraft : {}) }), [documentDraft, effectiveness, forcedUnitId, functionRequirements, hazardDraft, identity, safeguardId, sourceDraft, testing]);
  const validation = safeguardSchema.safeParse(payload);
  const disabledReason = !validation.success ? validation.error.issues.map((issue) => issue.message).join(' ') : undefined;
  const saving = mutations.create.isPending || mutations.update.isPending || mutations.addHazard.isPending || mutations.updateFunctionRequirements.isPending || mutations.addSourceLink.isPending || mutations.updateEffectiveness.isPending || mutations.updateTestingStatus.isPending || mutations.linkDocument.isPending;

  async function save() {
    setError(null);
    if (!validation.success) {
      setError(disabledReason ?? 'Required safeguard fields are missing.');
      return;
    }
    try {
      const result = safeguardId ? await mutations.update.mutateAsync(payload) : await mutations.create.mutateAsync(payload);
      router.push(`/process-safety-information/safeguards/${result.safeguard.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save safeguard/control.');
    }
  }

  async function addHazard() {
    if (!safeguardId || !hazardDraft.scenario_title || !hazardDraft.hazard_type) return;
    await mutations.addHazard.mutateAsync(hazardDraft);
    setHazardDraft({ source_module: 'Manual hazard scenario' });
  }

  async function addSourceLink() {
    if (!safeguardId || !sourceDraft.linked_module) return;
    await mutations.addSourceLink.mutateAsync(sourceDraft);
    setSourceDraft({ sync_mode: 'Compare only' });
  }

  async function linkDocument() {
    if (!safeguardId || !documentDraft.document_id) return;
    await mutations.linkDocument.mutateAsync(documentDraft);
    setDocumentDraft({ document_type: 'Safeguard design basis', relationship_type: 'Evidence', required: true, readiness_impact: true });
  }

  if (lookups.isLoading) return <PsiLoadingState rows={8} />;
  if (lookups.isError) return <PsiErrorState message={lookups.error.message} onRetry={() => void lookups.refetch()} />;
  if (!lookups.data) return null;

  return <div className="space-y-5">
    <PsiCard title={safeguardId ? 'Edit Safeguard / Control' : 'Create Safeguard / Control'} subtitle="Complete the PDF-required workflow. Backend enforces company/site/unit/equipment isolation, source/document scope, completeness, conflicts, MOC/PSSR/MI impact, audit, and PSI history.">
      <div className="flex flex-wrap gap-2">{['1 Identity', '2 Hazard / Scenario', '3 Function', '4 Source Link', '5 Effectiveness', '6 Testing / Impairment', '7 Evidence', '8 Review'].map((step) => <span key={step} className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1 text-xs font-semibold">{step}</span>)}</div>
    </PsiCard>
    {error ? <PsiErrorState message={error} /> : null}
    <SafeguardIdentitySection value={identity} lookups={lookups.data} forcedUnitId={forcedUnitId} onChange={(patch) => setIdentity((current) => ({ ...current, ...patch }))} />
    <SafeguardHazardScenarioSection existing={initial?.hazardLinks ?? []} draft={hazardDraft} onDraftChange={(patch) => setHazardDraft((current) => ({ ...current, ...patch }))} onAdd={safeguardId ? () => void addHazard() : undefined} busy={saving} />
    <SafeguardFunctionRequirementsSection value={functionRequirements} onChange={(patch) => setFunctionRequirements((current) => ({ ...current, ...patch }))} />
    <SafeguardSourceModuleLinkSection existing={initial?.sourceLinks ?? []} draft={sourceDraft} lookups={lookups.data} onDraftChange={(patch) => setSourceDraft((current) => ({ ...current, ...patch }))} onAdd={safeguardId ? () => void addSourceLink() : undefined} busy={saving} />
    <SafeguardEffectivenessIndependenceSection value={effectiveness} lookups={lookups.data} onChange={(patch) => setEffectiveness((current) => ({ ...current, ...patch }))} />
    <SafeguardTestingImpairmentSection value={testing} lookups={lookups.data} onChange={(patch) => setTesting((current) => ({ ...current, ...patch }))} />
    <SafeguardDocumentsEvidenceSection existing={initial?.documents ?? []} draft={documentDraft} lookups={lookups.data} onDraftChange={(patch) => setDocumentDraft((current) => ({ ...current, ...patch }))} onAdd={safeguardId ? () => void linkDocument() : undefined} busy={saving} />
    <PsiCard title="8. Review & Save" subtitle="Critical safeguard rules, source/document validation, completeness, conflict checks, audit, and PSI history are enforced by the backend.">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[var(--psm-muted)]">{disabledReason ?? 'Ready to save. After saving, run source status, completeness, and conflict checks from the detail header.'}</p><div className="flex gap-2"><PsiButton variant="secondary" onClick={() => router.back()}>Cancel</PsiButton><PsiButton onClick={() => void save()} disabled={saving || Boolean(disabledReason)} title={saving ? 'Saving safeguard/control.' : disabledReason}>{saving ? 'Saving...' : safeguardId ? 'Save Changes' : 'Create Safeguard'}</PsiButton></div></div>
    </PsiCard>
  </div>;
}
