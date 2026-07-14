'use client';

import { useState } from 'react';
import { useLopaRecommendationMutations, useLopaRecommendations } from '../../hooks/useLopaRecommendations';
import type { LopaRecommendationFilters } from '../../types/lopa-recommendation.types';
import { AddEditRecommendationDialog } from '../recommendations/AddEditRecommendationDialog';
import { EvidenceClosureVerificationPanel } from '../recommendations/EvidenceClosureVerificationPanel';
import { IplGapActionsPanel } from '../recommendations/IplGapActionsPanel';
import { LinkedActionsPanel } from '../recommendations/LinkedActionsPanel';
import { LopaActionRegister } from '../recommendations/LopaActionRegister';
import { LopaRecommendationsHeader } from '../recommendations/LopaRecommendationsHeader';
import { LopaRecommendationsRegister } from '../recommendations/LopaRecommendationsRegister';
import { LopaRecommendationsSummaryCards } from '../recommendations/LopaRecommendationsSummaryCards';
import { LopaSourceFindingsPanel } from '../recommendations/LopaSourceFindingsPanel';
import { OverdueEscalationPanel } from '../recommendations/OverdueEscalationPanel';
import { RecommendationBulkActions } from '../recommendations/RecommendationBulkActions';
import { RecommendationDetailDrawer } from '../recommendations/RecommendationDetailDrawer';
import { RecommendationFilters } from '../recommendations/RecommendationFilters';
import { RecommendationReadinessPanel } from '../recommendations/RecommendationReadinessPanel';
import { RiskGapSilActionsPanel } from '../recommendations/RiskGapSilActionsPanel';
import { UniversalActionCreationDrawer } from '../recommendations/UniversalActionCreationDrawer';

const emptyRecommendation = {
  title: '',
  description: '',
  sourceType: 'Manual',
  sourceTab: 'Recommendations / Actions',
  recommendationType: 'Manual',
  priority: 'Medium',
  blocking: true,
  verificationRequired: true
};

export function LopaRecommendationsActionsTab({ id }: { id: string }) {
  const [filters, setFilters] = useState<LopaRecommendationFilters>({});
  const [selected, setSelected] = useState<any>(null);
  const [recommendationForm, setRecommendationForm] = useState<any>(emptyRecommendation);
  const [recommendationDialogOpen, setRecommendationDialogOpen] = useState(false);
  const [actionForm, setActionForm] = useState<any>({});
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const query = useLopaRecommendations(id, filters);
  const mutations = useLopaRecommendationMutations(id);
  const data = query.data;

  const rows = data?.recommendations?.rows ?? [];
  const context = data?.context ?? {};
  const readOnly = !!data?.readOnly;

  function openAddRecommendation(seed?: any) {
    setRecommendationForm({ ...emptyRecommendation, ...(seed ?? {}) });
    setRecommendationDialogOpen(true);
  }

  function saveRecommendation() {
    const payload = {
      ...recommendationForm,
      title: recommendationForm.title || recommendationForm.description || 'LOPA recommendation',
      description: recommendationForm.description || recommendationForm.title || 'Recommendation created from LOPA study review.'
    };
    if (recommendationForm.id) {
      mutations.update.mutate({ recommendationId: recommendationForm.id, values: payload }, { onSuccess: () => setRecommendationDialogOpen(false) });
    } else {
      mutations.create.mutate(payload, { onSuccess: () => setRecommendationDialogOpen(false) });
    }
  }

  function openAction(row?: any) {
    setActionForm({
      recommendationId: row?.id,
      sourceType: row ? 'Recommendation' : 'Gap',
      title: row?.title ? `Action: ${row.title}` : '',
      description: row?.description ?? '',
      priority: row?.priority === 'Critical' ? 'SAFETY_CRITICAL' : row?.priority?.toUpperCase?.() ?? 'MEDIUM',
      ownerId: row?.owner_id,
      dueDate: row?.due_date,
      blocking: row?.blocking ?? true,
      evidenceRequired: row?.evidence_required ?? false,
      verificationRequired: row?.verification_required ?? true
    });
    setActionDialogOpen(true);
  }

  function saveAction() {
    mutations.createAction.mutate(actionForm, { onSuccess: () => setActionDialogOpen(false) });
  }

  if (query.isLoading) return <State text="Loading LOPA recommendations and Universal Actions..." />;
  if (query.isError) return <State text="Unable to load recommendations/actions. Check permission or API status." tone="error" />;
  if (!data) return <State text="No recommendation data returned." />;

  const busy = mutations.create.isPending || mutations.update.isPending || mutations.createAction.isPending || mutations.changeStatus.isPending;

  return (
    <section className="space-y-4">
      <LopaRecommendationsHeader readOnly={readOnly} onAdd={() => openAddRecommendation()} onSync={() => mutations.syncActions.mutate()} onExport={() => mutations.export.mutate(filters)} syncing={mutations.syncActions.isPending} />
      <LopaRecommendationsSummaryCards summary={data.summary ?? {}} />
      <RecommendationFilters filters={filters} setFilters={setFilters} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_.9fr]">
        <div className="space-y-4">
          <LopaSourceFindingsPanel rows={data.sourceFindings ?? []} onCreate={(finding: any) => openAddRecommendation({ title: finding.title ?? finding.findingType, description: finding.description, sourceType: finding.sourceType ?? 'Finding', sourceTab: finding.sourceTab, riskRelevance: finding.riskRelevance, priority: finding.priority ?? 'High', blocking: true })} />
          <div className="rounded-xl border border-cyan-300/10 bg-[#071525] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-black text-white">Recommendations Register</h3>
              <span className="text-xs text-slate-500">{data.recommendations?.total ?? rows.length} records</span>
            </div>
            <LopaRecommendationsRegister rows={rows} onOpen={setSelected} onAction={openAction} onStatus={(row, status) => mutations.changeStatus.mutate({ recommendationId: row.id, status, reason: 'Updated from LOPA recommendations tab.' })} />
          </div>
          <LopaActionRegister rows={data.actions ?? []} onVerify={(action: any) => mutations.verifyActionClosure.mutate({ actionId: action.id, notes: 'Verified from LOPA recommendations tab.' })} />
          <RecommendationBulkActions onSync={() => mutations.syncActions.mutate()} onExport={() => mutations.export.mutate(filters)} />
        </div>
        <div className="space-y-4">
          <RecommendationReadinessPanel readiness={data.readiness} />
          <RiskGapSilActionsPanel rows={data.riskGapActions ?? []} />
          <IplGapActionsPanel rows={data.iplGapActions ?? []} />
          <LinkedActionsPanel actions={data.actions ?? []} />
          <EvidenceClosureVerificationPanel rows={data.evidence ?? []} />
          <OverdueEscalationPanel rows={data.overdue ?? []} onEscalate={() => mutations.escalate.mutate('Escalated from LOPA recommendations tab.')} onReminder={() => mutations.sendReminder.mutate('Reminder sent from LOPA recommendations tab.')} />
        </div>
      </div>
      {mutations.create.isError || mutations.update.isError || mutations.createAction.isError || mutations.changeStatus.isError ? <State text="Recommendation/action save failed. Check required fields, permissions, or backend validation." tone="error" /> : null}
      <AddEditRecommendationDialog open={recommendationDialogOpen} onClose={() => setRecommendationDialogOpen(false)} form={recommendationForm} setForm={setRecommendationForm} context={context} onSave={saveRecommendation} saving={busy} />
      <UniversalActionCreationDrawer open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} form={actionForm} setForm={setActionForm} context={context} onSave={saveAction} saving={mutations.createAction.isPending} />
      <RecommendationDetailDrawer row={selected} open={!!selected} onClose={() => setSelected(null)} />
    </section>
  );
}

function State({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'error' }) {
  return <div className={`rounded-xl border p-4 text-sm ${tone === 'error' ? 'border-red-400/20 bg-red-500/10 text-red-100' : 'border-cyan-300/10 bg-[#071525] text-slate-400'}`}>{text}</div>;
}
