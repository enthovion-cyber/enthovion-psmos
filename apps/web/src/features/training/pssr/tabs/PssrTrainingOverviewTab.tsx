import { PssrHandoverBlockerBadge } from '../../shared/PssrHandoverBlockerBadge';
import { PssrApprovalBlockerBadge } from '../../shared/PssrApprovalBlockerBadge';
import { PssrStartupBlockerBadge } from '../../shared/PssrStartupBlockerBadge';
import { PssrTrainingImpactLevelBadge } from '../../shared/PssrTrainingImpactLevelBadge';
import { PssrTrainingReadinessStatusBadge } from '../../shared/PssrTrainingReadinessStatusBadge';
import { TrainingCard } from '../../shared/TrainingUi';
import { MiniField, PanelGrid, valueText } from '../PssrTrainingPanelPrimitives';
import type { PssrTrainingReadinessDetail } from '../../types/pssr-training.types';

export function PssrTrainingOverviewTab({ detail }: { detail: PssrTrainingReadinessDetail }) {
  const row = detail.readiness;
  return <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]"><TrainingCard title="Readiness Snapshot" subtitle="PSSR context, status, impact level and source snapshot from backend."><div className="flex flex-wrap gap-2"><PssrTrainingReadinessStatusBadge status={row.readiness_record_status} /><PssrTrainingReadinessStatusBadge status={row.readiness_status} /><PssrTrainingImpactLevelBadge level={row.impact_level} /><PssrApprovalBlockerBadge value={row.pssr_approval_blocker ?? row.approval_blocker} /><PssrHandoverBlockerBadge value={row.handover_blocker} /><PssrStartupBlockerBadge value={row.startup_blocker} /></div><PanelGrid><MiniField label="Readiness code" value={row.readiness_code} /><MiniField label="PSSR" value={row.pssr?.pssr_number ?? row.pssr_id} /><MiniField label="PSSR title" value={row.pssr?.title} /><MiniField label="Source" value={row.readiness_source} /><MiniField label="Training required" value={row.training_required} /><MiniField label="Safety critical" value={row.safety_critical} /></PanelGrid><p className="mt-3 text-sm text-[var(--psm-muted)]">{valueText(row.training_required_reason ?? row.readiness_description)}</p></TrainingCard><TrainingCard title="Counts"><PanelGrid><MiniField label="Required workers" value={detail.requiredWorkers?.length ?? 0} /><MiniField label="Assignments" value={detail.assignments?.length ?? 0} /><MiniField label="Open blockers" value={detail.blockers?.filter((b) => b.blocker_status === 'Open').length ?? 0} /><MiniField label="Waivers" value={detail.waivers?.length ?? 0} /><MiniField label="Readiness checks" value={Array.isArray(detail.readinessCheck) ? detail.readinessCheck.length : detail.readinessCheck ? 1 : 0} /><MiniField label="History events" value={detail.history?.length ?? 0} /></PanelGrid></TrainingCard></div>;
}

