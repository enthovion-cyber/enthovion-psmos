'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import { useHazopRisk, useHazopRiskMutations } from '../../hooks/useHazopRisk';
import { HazopHighCriticalRiskPanel } from '../risk/HazopHighCriticalRiskPanel';
import { HazopLopaTriggerPanel } from '../risk/HazopLopaTriggerPanel';
import { HazopResidualRiskPanel } from '../risk/HazopResidualRiskPanel';
import { HazopRiskAcceptanceDialog } from '../risk/HazopRiskAcceptanceDialog';
import { HazopRiskAcceptancePanel } from '../risk/HazopRiskAcceptancePanel';
import { HazopRiskBadge, HazopRiskMetric, HazopRiskMiniButton, HazopRiskStateCard, HazopRiskStatusBadge } from '../risk/HazopRiskBadge';
import { HazopRiskFilters } from '../risk/HazopRiskFilters';
import { HazopRiskHistoryPanel } from '../risk/HazopRiskHistoryPanel';
import { HazopRiskMatrixPanel } from '../risk/HazopRiskMatrixPanel';
import { HazopRiskSummaryCards } from '../risk/HazopRiskSummaryCards';
import { HazopRiskUpdateDialog } from '../risk/HazopRiskUpdateDialog';
import { HazopScenarioRiskRegister } from '../risk/HazopScenarioRiskRegister';

type Props = { study: any };

export function HazopRiskRankingTab({ study }: Props) {
  const [filters, setFilters] = useState({ search: '', riskLevel: 'All', status: 'All', lopaRequired: 'All' });
  const [selected, setSelected] = useState<any>(null);
  const [riskEdit, setRiskEdit] = useState<any>(null);
  const [acceptance, setAcceptance] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const permissionsQuery = useMyPermissions();
  const permissions = permissionsQuery.data ?? [];
  const can = (permission: string) => permissions.includes(permission) || permissions.includes('hazop:manage');
  const readonly = ['Approved', 'Closed', 'Cancelled'].includes(study.status);
  const queries = useHazopRisk(study.id, filters);
  const mutations = useHazopRiskMutations(study.id);
  const registerRows = queries.register.data?.rows ?? [];
  const loading = queries.register.isLoading || queries.summary.isLoading || queries.matrix.isLoading;

  const exportCsv = async () => {
    const file = await mutations.exportRegister.mutateAsync();
    const blob = new Blob([file.content], { type: file.contentType ?? 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.fileName ?? `${study.study_number}-risk-register.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (!can('hazop.risk.view')) {
    return <HazopRiskStateCard tone="red" title="Permission denied" text="You do not have permission to view HAZOP risk ranking." />;
  }

  return (
    <div className="space-y-4">
      {readonly ? <HazopRiskStateCard tone="amber" title="Read-only study" text="Approved, closed, and cancelled studies require an authorized re-open before risk ranking can be edited." /> : null}
      {queries.register.isError ? <HazopRiskStateCard tone="red" title="Unable to load risk register" text="The risk ranking API returned an error. Check database migrations and permissions." /> : null}

      <HazopRiskSummaryCards summary={queries.summary.data} loading={loading} />

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <div className="space-y-4">
          <HazopRiskMatrixPanel data={queries.matrix.data} />
          <HazopRiskFilters filters={filters} onChange={setFilters} canExport={can('hazop.risk.export')} onExport={exportCsv} exporting={mutations.exportRegister.isPending} />
          <HazopScenarioRiskRegister
            rows={registerRows}
            loading={loading}
            canEdit={can('hazop.risk.edit') && !readonly}
            canRecalculate={can('hazop.risk.recalculate') && !readonly}
            canAccept={can('hazop.risk.accept') && !readonly}
            onOpen={setSelected}
            onEdit={setRiskEdit}
            onAccept={setAcceptance}
            onRecalculate={(scenarioId: string) => mutations.recalculate.mutate(scenarioId)}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </div>

        <aside className="space-y-4">
          <HazopHighCriticalRiskPanel rows={queries.highCritical.data ?? []} onOpen={setSelected} />
          <HazopResidualRiskPanel rows={registerRows} onOpen={setSelected} />
          <HazopLopaTriggerPanel rows={queries.lopaTriggers.data ?? []} canMark={can('hazop.risk.lopa.mark') && !readonly} canClear={can('hazop.risk.lopa.clear') && !readonly} onClear={(scenario: any) => mutations.clearLopa.mutate({ scenarioId: scenario.id, reason: 'LOPA cleared after authorized risk review' })} />
          <HazopRiskAcceptancePanel rows={queries.acceptances.data ?? []} canApprove={can('hazop.risk.accept.approve') && !readonly} onApprove={(row: any) => mutations.approveAcceptance.mutate({ acceptanceId: row.id, values: { comment: 'Accepted by authorized reviewer' } })} onReject={(row: any) => mutations.rejectAcceptance.mutate({ acceptanceId: row.id, values: { reason: 'Rejected by authorized reviewer' } })} />
          <HazopRiskHistoryPanel rows={queries.history.data ?? []} />
        </aside>
      </div>

      <BulkStrip selectedIds={selectedIds} disabled={!can('hazop.risk.lopa.mark') || readonly} onBulkLopa={(reason) => mutations.bulkLopa.mutate({ scenarioIds: selectedIds, reason })} />

      {selected ? <ScenarioRiskDrawer scenario={selected} onClose={() => setSelected(null)} onEdit={() => setRiskEdit(selected)} onAccept={() => setAcceptance(selected)} canEdit={can('hazop.risk.edit') && !readonly} canAccept={can('hazop.risk.accept') && !readonly} /> : null}
      {riskEdit ? <HazopRiskUpdateDialog scenario={riskEdit} saving={mutations.updateRisk.isPending} onClose={() => setRiskEdit(null)} onSave={(values: Record<string, any>) => mutations.updateRisk.mutate({ scenarioId: riskEdit.id, values }, { onSuccess: () => setRiskEdit(null) })} /> : null}
      {acceptance ? <HazopRiskAcceptanceDialog scenario={acceptance} saving={mutations.requestAcceptance.isPending} onClose={() => setAcceptance(null)} onSave={(values: Record<string, any>) => mutations.requestAcceptance.mutate({ scenarioId: acceptance.id, values }, { onSuccess: () => setAcceptance(null) })} /> : null}
    </div>
  );
}

function BulkStrip({ selectedIds, disabled, onBulkLopa }: { selectedIds: string[]; disabled: boolean; onBulkLopa: (reason: string) => void }) {
  return selectedIds.length ? <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 text-sm"><Filter size={15} className="mr-2 inline" />{selectedIds.length} selected <button disabled={disabled} onClick={() => onBulkLopa('Bulk LOPA trigger from risk ranking register')} className="ml-3 rounded-lg border border-[var(--psm-line)] px-3 py-2 font-semibold disabled:opacity-50">Mark LOPA Required</button></section> : null;
}

function ScenarioRiskDrawer({ scenario, onClose, onEdit, onAccept, canEdit, canAccept }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <aside className="ml-auto h-full w-full max-w-2xl overflow-y-auto border-l border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><div className="text-sm text-[var(--psm-muted)]">Scenario detail</div><h2 className="text-2xl font-semibold">{scenario.scenario_number}</h2><div className="mt-2 flex gap-2"><HazopRiskBadge value={scenario.risk_level} />{scenario.lopa_required ? <HazopRiskStatusBadge tone="red">LOPA Required</HazopRiskStatusBadge> : null}</div></div>
          <button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm">Close</button>
        </div>
        <div className="grid gap-3 md:grid-cols-3"><HazopRiskMetric label="Severity" value={scenario.severity} /><HazopRiskMetric label="Likelihood" value={scenario.likelihood} /><HazopRiskMetric label="Score" value={scenario.risk_score} /></div>
        <InfoBlock title="Deviation" text={`${scenario.guideword ?? '-'} / ${scenario.parameter ?? '-'} / ${scenario.deviation_text ?? '-'}`} />
        <InfoBlock title="Cause" text={scenario.cause} />
        <InfoBlock title="Consequence" text={scenario.consequence} />
        <InfoBlock title="Safeguards" text={scenario.existing_safeguards ?? 'No safeguards captured'} />
        <InfoBlock title="LOPA Trigger" text={scenario.lopa_trigger_reason ?? 'No active trigger'} />
        <div className="mt-5 flex flex-wrap gap-2">{canEdit ? <button onClick={onEdit} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Edit Risk</button> : null}{canAccept ? <HazopRiskMiniButton onClick={onAccept}>Request Acceptance</HazopRiskMiniButton> : null}</div>
      </aside>
    </div>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return <section className="mt-4 rounded-xl border border-[var(--psm-line)] p-4"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm text-[var(--psm-muted)]">{text}</p></section>;
}
