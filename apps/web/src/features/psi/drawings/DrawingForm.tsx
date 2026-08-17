'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDrawingLookups } from '../hooks/useDrawings';
import { useDrawingMutations } from '../hooks/useDrawingMutations';
import { drawingSchema } from '../schemas/drawing.schema';
import { PsiButton, PsiCard, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import type { DrawingDetail } from '../types/drawing.types';
import { DrawingCompletenessReviewSection } from './sections/DrawingCompletenessReviewSection';
import { DrawingDocumentRevisionSection } from './sections/DrawingDocumentRevisionSection';
import { DrawingIdentitySection } from './sections/DrawingIdentitySection';
import { DrawingMocRedlineSection } from './sections/DrawingMocRedlineSection';
import { DrawingRelationshipsSection } from './sections/DrawingRelationshipsSection';
import { DrawingScopeSection } from './sections/DrawingScopeSection';
import { DrawingTagIndexSection } from './sections/DrawingTagIndexSection';

export function DrawingForm({ initial, drawingId, forcedUnitId }: { initial?: DrawingDetail | undefined; drawingId?: string | undefined; forcedUnitId?: string | undefined }) {
  const router = useRouter();
  const lookups = useDrawingLookups();
  const mutations = useDrawingMutations(drawingId, forcedUnitId);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState<Record<string, any>>(() => ({
    unit_id: forcedUnitId ?? '',
    drawing_type: '',
    discipline: '',
    status: 'Draft',
    verification_status: 'Unverified',
    source_method: 'Manual',
    redline_status: 'None',
    moc_update_status: 'Not Required',
    ...(initial?.drawing ?? {}),
    ...(initial?.documents?.[0] ?? {}),
    ...(initial?.scope ?? {}),
    ...(initial?.mocRedlines ?? {})
  }));

  const payload = useMemo(() => ({
    ...value,
    unit_id: forcedUnitId ?? value.unit_id,
    relationships: value.relationship_linked_module && value.relationship_linked_record_id ? [{
      linked_module: value.relationship_linked_module,
      linked_record_id: value.relationship_linked_record_id,
      linked_record_label: value.relationship_linked_record_label,
      relationship_type: value.relationship_type,
      readiness_impact: Boolean(value.relationship_readiness_impact),
      pssr_impact: Boolean(value.relationship_pssr_impact),
      moc_impact: Boolean(value.relationship_moc_impact)
    }] : [],
    tagIndex: value.tag_number && value.tag_type ? [{
      tag_number: value.tag_number,
      tag_type: value.tag_type,
      tag_description: value.tag_description,
      service: value.tag_service,
      linked_module: value.tag_linked_module,
      linked_record_id: value.tag_linked_record_id,
      sheet_page_reference: value.sheet_page_reference,
      coordinate_reference: value.coordinate_reference,
      verification_status: value.verification_status,
      source_method: value.source_method,
      mismatch_reason: value.mismatch_reason
    }] : []
  }), [forcedUnitId, value]);

  const validation = drawingSchema.safeParse(payload);
  const disabledReason = !validation.success ? validation.error.issues.map((issue) => issue.message).join(' ') : undefined;
  const saving = mutations.create.isPending || mutations.update.isPending;

  async function submit() {
    setError(null);
    if (!validation.success) {
      setError(disabledReason ?? 'Required drawing fields are missing.');
      return;
    }
    try {
      const result = drawingId ? await mutations.update.mutateAsync(payload) : await mutations.create.mutateAsync(payload);
      router.push(`/process-safety-information/drawings/${result.drawing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save drawing.');
    }
  }

  if (lookups.isLoading) return <PsiLoadingState rows={6} />;
  if (lookups.isError) return <PsiErrorState message={lookups.error.message} onRetry={() => void lookups.refetch()} />;

  const patch = (next: Record<string, any>) => setValue((current) => ({ ...current, ...next }));
  return (
    <div className="space-y-5">
      <PsiCard title={drawingId ? 'Edit Drawing / P&ID' : 'Create Drawing / P&ID'} subtitle="Seven-step PSI drawing workflow: identity, Document Control revision, scope, relationships, tag index foundation, MOC/redline/as-built status, completeness and review.">
        <div className="flex flex-wrap gap-2">{['1 Identity', '2 Document / Revision', '3 Scope', '4 Relationships', '5 Tag Index', '6 MOC / Redline / As-Built', '7 Completeness / Review'].map((step) => <span key={step} className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1 text-xs font-semibold">{step}</span>)}</div>
      </PsiCard>
      {error ? <PsiErrorState message={error} /> : null}
      <DrawingIdentitySection value={value} lookups={lookups.data} forcedUnitId={forcedUnitId} onChange={patch} />
      <DrawingDocumentRevisionSection value={value} lookups={lookups.data} onChange={patch} />
      <DrawingScopeSection value={value} onChange={patch} />
      <DrawingRelationshipsSection value={value} lookups={lookups.data} onChange={patch} />
      <DrawingTagIndexSection value={value} lookups={lookups.data} onChange={patch} />
      <DrawingMocRedlineSection value={value} lookups={lookups.data} onChange={patch} />
      <DrawingCompletenessReviewSection completenessStatus={initial?.drawing.completeness_status ?? null} conflictStatus={initial?.drawing.conflict_status ?? null} />
      <PsiCard title="Save" subtitle="Saving runs backend validation, current-approved checks, conflict checks, completeness, audit log, and PSI history.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--psm-muted)]">{disabledReason ?? 'Ready to save with backend checks.'}</p>
          <div className="flex gap-2">
            <PsiButton variant="secondary" onClick={() => router.back()}>Cancel</PsiButton>
            <PsiButton onClick={() => void submit()} disabled={saving || Boolean(disabledReason)} title={saving ? 'Saving drawing.' : disabledReason}>{saving ? 'Saving...' : drawingId ? 'Save Changes' : 'Create Drawing'}</PsiButton>
          </div>
        </div>
      </PsiCard>
    </div>
  );
}
