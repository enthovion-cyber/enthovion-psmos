'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import { useHazopSafeguardGaps } from '../../hooks/useHazopSafeguardGaps';
import { useHazopSafeguardMutations } from '../../hooks/useHazopSafeguardMutations';
import { useHazopSafeguards } from '../../hooks/useHazopSafeguards';
import type { HazopSafeguard, HazopSafeguardFilters as HazopSafeguardFilterState } from '../../types/hazop-safeguard.types';
import { AddEditSafeguardDialog } from '../safeguards/AddEditSafeguardDialog';
import { HazopIplCandidatePanel } from '../safeguards/HazopIplCandidatePanel';
import { HazopIplValidationDialog } from '../safeguards/HazopIplValidationDialog';
import { HazopProofTestStatusPanel } from '../safeguards/HazopProofTestStatusPanel';
import { HazopSafeguardDetailDrawer } from '../safeguards/HazopSafeguardDetailDrawer';
import { HazopSafeguardDocumentPanel } from '../safeguards/HazopSafeguardDocumentPanel';
import { HazopSafeguardEquipmentPanel } from '../safeguards/HazopSafeguardEquipmentPanel';
import { HazopSafeguardFilters } from '../safeguards/HazopSafeguardFilters';
import { HazopSafeguardGapPanel } from '../safeguards/HazopSafeguardGapPanel';
import { HazopSafeguardRegister } from '../safeguards/HazopSafeguardRegister';
import { HazopSafeguardSummaryCards } from '../safeguards/HazopSafeguardSummaryCards';
import { HazopSafetySystemSifPanel } from '../safeguards/HazopSafetySystemSifPanel';
import { SafeguardPanel } from '../safeguards/HazopIplStatusBadge';

type Props = { study: any };

export function HazopSafeguardsIplTab({ study }: Props) {
  const [filters, setFilters] = useState<HazopSafeguardFilterState>({ search: '', safeguardType: 'All', iplCandidate: 'All', validationStatus: 'All', gapStatus: 'All', page: 1, limit: 25 });
  const [drawer, setDrawer] = useState<HazopSafeguard | null>(null);
  const [editing, setEditing] = useState<HazopSafeguard | null>(null);
  const [adding, setAdding] = useState(false);
  const [validating, setValidating] = useState<HazopSafeguard | null>(null);
  const permissionsQuery = useMyPermissions();
  const permissions = permissionsQuery.data ?? [];
  const can = (permission: string) => permissions.includes(permission) || permissions.includes('hazop:manage');
  const readonly = ['Approved', 'Closed', 'Cancelled'].includes(study.status);
  const queries = useHazopSafeguards(study.id, filters);
  const gapsQuery = useHazopSafeguardGaps(study.id);
  const mutations = useHazopSafeguardMutations(study.id);
  const rows: HazopSafeguard[] = queries.register.data?.rows ?? [];
  const context = queries.context.data ?? {};
  const scenarios = context.scenarios ?? study.scenarios ?? [];
  const loading = queries.summary.isLoading || queries.register.isLoading || queries.context.isLoading;

  const equipmentLinks = useMemo(() => rows.filter((row) => row.equipment_id), [rows]);
  const documentLinks = useMemo(() => rows.filter((row) => row.document_id), [rows]);

  if (!can('hazop.safeguards.view')) {
    return <StateCard tone="red" title="Permission denied" text="You do not have permission to view HAZOP safeguards or IPL records." />;
  }

  const exportRegister = async () => {
    const file = await mutations.exportRegister.mutateAsync();
    const blob = new Blob([file.content], { type: file.contentType ?? 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.fileName ?? `${study.study_number}-safeguards-register.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const saveSafeguard = (scenarioId: string, values: Record<string, any>) => {
    if (editing) mutations.update.mutate({ safeguardId: editing.id, values }, { onSuccess: () => setEditing(null) });
    else mutations.add.mutate({ scenarioId, values }, { onSuccess: () => setAdding(false) });
  };

  const deleteSafeguard = (row: HazopSafeguard) => {
    if (window.confirm(`Delete ${row.safeguard_number}? This creates an audit event and cannot be undone.`)) mutations.delete.mutate(row.id);
  };

  return (
    <div className="space-y-4">
      {readonly ? <StateCard tone="amber" title="Read-only study" text="Approved, closed, and cancelled studies require authorized re-open before safeguards can be edited." /> : null}
      {queries.register.isError ? <StateCard tone="red" title="Unable to load safeguards" text="The Safeguards / IPL API returned an error. Check migration status, permissions, and company/site access." /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Safeguards / IPL</h2>
          <p className="text-sm text-[var(--psm-muted)]">Credited safeguards, IPL validation, proof testing, gaps, and LOPA/SIL triggers.</p>
        </div>
        {can('hazop.safeguards.create') && !readonly ? <button onClick={() => setAdding(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"><Plus size={16} className="mr-2 inline" />Add Safeguard</button> : null}
      </div>

      <HazopSafeguardSummaryCards summary={queries.summary.data} loading={loading} />

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <HazopSafeguardFilters filters={filters} onChange={setFilters} onExport={can('hazop.safeguards.export') ? exportRegister : undefined} exporting={mutations.exportRegister.isPending} />
          <HazopSafeguardRegister
            rows={rows}
            loading={loading}
            readonly={readonly}
            canEdit={can('hazop.safeguards.edit')}
            canDelete={can('hazop.safeguards.delete')}
            onOpen={setDrawer}
            onEdit={setEditing}
            onDelete={deleteSafeguard}
            onValidate={setValidating}
          />
        </div>
        <aside className="space-y-4">
          <HazopIplCandidatePanel rows={queries.iplCandidates.data ?? []} onOpen={setDrawer} />
          <HazopSafetySystemSifPanel rows={rows} />
          <HazopProofTestStatusPanel rows={queries.proofTests.data ?? []} />
          <HazopSafeguardGapPanel
            rows={gapsQuery.data ?? []}
            canClose={can('hazop.safeguards.gap.close') && !readonly}
            canCreateAction={can('actions.create') && !readonly}
            onClose={(gap) => mutations.closeGap.mutate(gap.id)}
            onCreateAction={(gap) => mutations.createGapAction.mutate({ gapId: gap.id, values: { title: gap.gap_type, description: gap.gap_description, priority: gap.severity } })}
          />
        </aside>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <HazopSafeguardEquipmentPanel rows={equipmentLinks} />
        <HazopSafeguardDocumentPanel rows={documentLinks} />
        <SafeguardPanel title="Policy Sync">
          <div className="space-y-3 text-sm text-[var(--psm-muted)]">
            <div>LOPA trigger for credited IPL: <strong className="text-[var(--psm-text)]">{context.sitePolicies?.triggerLopaForIpl ? 'Enabled' : 'Disabled'}</strong></div>
            <div>Administrative control as IPL: <strong className="text-[var(--psm-text)]">{context.sitePolicies?.allowAdministrativeIpl ? 'Allowed by policy' : 'Blocked unless approved'}</strong></div>
            <div>Scenario, risk ranking, dashboard counters, audit history, and search index are updated by backend mutations.</div>
          </div>
        </SafeguardPanel>
      </div>

      <AddEditSafeguardDialog open={adding || Boolean(editing)} safeguard={editing ?? undefined} scenarios={scenarios} saving={mutations.add.isPending || mutations.update.isPending} onClose={() => { setAdding(false); setEditing(null); }} onSave={saveSafeguard} />
      {drawer ? <HazopSafeguardDetailDrawer safeguard={drawer} readonly={readonly} canEdit={can('hazop.safeguards.edit')} onClose={() => setDrawer(null)} onEdit={() => { setEditing(drawer); setDrawer(null); }} onValidate={() => setValidating(drawer)} onMarkIpl={() => mutations.markIpl.mutate(drawer.id)} onMarkCredited={() => mutations.markCredited.mutate(drawer.id)} /> : null}
      {validating ? <HazopIplValidationDialog studyId={study.id} safeguard={validating} criteria={context.iplCriteria ?? []} onClose={() => setValidating(null)} /> : null}
    </div>
  );
}

function StateCard({ tone, title, text }: { tone: 'red' | 'amber'; title: string; text: string }) {
  const color = tone === 'red' ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-100';
  return <section className={`rounded-xl border p-4 text-sm ${color}`}><div className="font-semibold">{title}</div><div className="mt-1 opacity-85">{text}</div></section>;
}
