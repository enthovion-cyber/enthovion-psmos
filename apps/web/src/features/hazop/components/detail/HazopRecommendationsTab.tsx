'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import { useHazopRecommendationMutations } from '../../hooks/useHazopRecommendationMutations';
import { useHazopRecommendations } from '../../hooks/useHazopRecommendations';
import type { HazopRecommendation, HazopRecommendationFilters as FilterState } from '../../types/hazop-recommendation.types';
import { AddEditRecommendationDialog } from '../recommendations/AddEditRecommendationDialog';
import { HazopActionLinkPanel } from '../recommendations/HazopActionLinkPanel';
import { HazopClosureBlockerPanel } from '../recommendations/HazopClosureBlockerPanel';
import { HazopHighRiskRecommendationPanel } from '../recommendations/HazopHighRiskRecommendationPanel';
import { HazopOverdueEscalationPanel } from '../recommendations/HazopOverdueEscalationPanel';
import { HazopRecommendationDetailDrawer } from '../recommendations/HazopRecommendationDetailDrawer';
import { HazopRecommendationFilters } from '../recommendations/HazopRecommendationFilters';
import { HazopRecommendationRegister } from '../recommendations/HazopRecommendationRegister';
import { HazopRecommendationSummaryCards } from '../recommendations/HazopRecommendationSummaryCards';

export function HazopRecommendationsTab({ study }: { study: any }) {
  const [filters, setFilters] = useState<FilterState>({ page: 1, limit: 25, sourceType: 'All', priority: 'All', status: 'All', actionLinked: 'All', closureBlocker: 'All' });
  const [drawer, setDrawer] = useState<HazopRecommendation | null>(null);
  const [editing, setEditing] = useState<HazopRecommendation | null>(null);
  const [adding, setAdding] = useState(false);
  const permissions = useMyPermissions().data ?? [];
  const can = (permission: string) => permissions.includes(permission) || permissions.includes('hazop:manage');
  const readonly = ['Approved', 'Closed', 'Cancelled'].includes(study.status);
  const queries = useHazopRecommendations(study.id, filters);
  const mutations = useHazopRecommendationMutations(study.id);
  const rows: HazopRecommendation[] = queries.register.data?.rows ?? [];
  const context = queries.context.data ?? {};
  const loading = queries.summary.isLoading || queries.register.isLoading;

  if (!can('hazop.recommendations.view')) return <StateCard tone="red" title="Permission denied" text="You do not have permission to view HAZOP recommendations." />;

  const save = (values: Record<string, any>) => {
    if (editing) mutations.update.mutate({ recommendationId: editing.id, values }, { onSuccess: () => setEditing(null) });
    else mutations.create.mutate(values, { onSuccess: () => setAdding(false) });
  };
  const exportRegister = async () => {
    const file = await mutations.exportRegister.mutateAsync();
    const blob = new Blob([file.content], { type: file.contentType ?? 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.fileName ?? `${study.study_number}-recommendations-register.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const defer = (row: HazopRecommendation) => {
    const reason = window.prompt('Deferral reason');
    const newDueDate = window.prompt('New due date YYYY-MM-DD', row.due_date ?? '');
    if (reason && newDueDate) mutations.defer.mutate({ recommendationId: row.id, values: { deferralReason: reason, newDueDate } });
  };

  return (
    <div className="space-y-4">
      {readonly ? <StateCard tone="amber" title="Read-only study" text="Approved, closed, and cancelled studies require authorized re-open before recommendations can be edited." /> : null}
      {queries.register.isError ? <StateCard tone="red" title="Unable to load recommendations" text="The recommendation API returned an error. Check migrations, permissions, and site access." /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Recommendations / Actions</h2><p className="text-sm text-[var(--psm-muted)]">Recommendation health, Universal Action links, evidence, verification, and closure blockers.</p></div>{can('hazop.recommendations.create') && !readonly ? <button onClick={() => setAdding(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"><Plus size={16} className="mr-2 inline" />Add Recommendation</button> : null}</div>
      <HazopRecommendationSummaryCards summary={queries.summary.data} loading={loading} onFilter={(key) => key === 'overdue' ? setFilters({ ...filters, overdue: 'Yes' }) : key === 'closureBlockers' ? setFilters({ ...filters, closureBlocker: 'Yes' }) : undefined} />
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-4"><HazopRecommendationFilters filters={filters} onChange={setFilters} onExport={can('hazop.recommendations.export') ? exportRegister : undefined} exporting={mutations.exportRegister.isPending} /><HazopRecommendationRegister rows={rows} loading={loading} readonly={readonly} canEdit={can('hazop.recommendations.edit')} canDelete={can('hazop.recommendations.delete')} onOpen={setDrawer} onEdit={setEditing} onDelete={(row) => window.confirm(`Delete ${row.recommendation_number}?`) && mutations.delete.mutate(row.id)} onAction={(row) => mutations.createAction.mutate({ recommendationId: row.id })} onEvidence={setDrawer} onVerify={(row) => mutations.requestVerification.mutate(row.id)} /></div>
        <aside className="space-y-4"><HazopHighRiskRecommendationPanel rows={rows} onOpen={setDrawer} /><HazopActionLinkPanel rows={rows} canCreate={can('hazop.recommendations.action.create') && !readonly} canLink={can('hazop.recommendations.action.link') && !readonly} onCreate={(row) => mutations.createAction.mutate({ recommendationId: row.id })} onSync={(row) => mutations.syncAction.mutate(row.id)} /><HazopOverdueEscalationPanel rows={queries.overdue.data ?? []} onOpen={setDrawer} /><HazopClosureBlockerPanel rows={queries.blockers.data ?? []} onOpen={setDrawer} /></aside>
      </div>
      <AddEditRecommendationDialog open={adding || Boolean(editing)} recommendation={editing ?? undefined} context={context} saving={mutations.create.isPending || mutations.update.isPending} onClose={() => { setAdding(false); setEditing(null); }} onSave={save} />
      {drawer ? <HazopRecommendationDetailDrawer recommendation={drawer} readonly={readonly} canEdit={can('hazop.recommendations.edit')} canEvidence={can('hazop.recommendations.evidence.upload')} canVerify={can('hazop.recommendations.verify')} onClose={() => setDrawer(null)} onEdit={() => { setEditing(drawer); setDrawer(null); }} onCreateAction={() => mutations.createAction.mutate({ recommendationId: drawer.id })} onSyncAction={() => mutations.syncAction.mutate(drawer.id)} onUploadEvidence={(values) => mutations.addEvidence.mutate({ recommendationId: drawer.id, values })} onRequestVerification={() => mutations.requestVerification.mutate(drawer.id)} onVerify={(values) => mutations.verify.mutate({ recommendationId: drawer.id, values })} onReject={(values) => mutations.rejectVerification.mutate({ recommendationId: drawer.id, values })} onCancel={() => mutations.cancel.mutate({ recommendationId: drawer.id, values: { reason: 'Cancelled from recommendation drawer' } })} onDefer={() => defer(drawer)} /> : null}
    </div>
  );
}

function StateCard({ tone, title, text }: { tone: 'red' | 'amber'; title: string; text: string }) {
  const color = tone === 'red' ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-100';
  return <section className={`rounded-xl border p-4 text-sm ${color}`}><div className="font-semibold">{title}</div><div className="mt-1 opacity-85">{text}</div></section>;
}
