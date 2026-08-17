import { MocClosureBlockerBadge } from '../../shared/MocClosureBlockerBadge';
import { MocImplementationBlockerBadge } from '../../shared/MocImplementationBlockerBadge';
import { MocStartupBlockerBadge } from '../../shared/MocStartupBlockerBadge';
import { MocTrainingImpactLevelBadge } from '../../shared/MocTrainingImpactLevelBadge';
import { MocTrainingReadinessStatusBadge } from '../../shared/MocTrainingReadinessStatusBadge';
import { MocTrainingRequirementStatusBadge } from '../../shared/MocTrainingRequirementStatusBadge';
import { TrainingCard } from '../../shared/TrainingUi';
import { MiniField, PanelGrid, valueText } from '../MocTrainingPanelPrimitives';
import type { MocTrainingRequirementDetail } from '../../types/moc-training.types';

export function MocTrainingOverviewTab({ detail }: { detail: MocTrainingRequirementDetail }) {
  const row = detail.requirement;
  return <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]"><TrainingCard title="Requirement Snapshot" subtitle="MOC context, status, impact level and source snapshot from backend."><div className="flex flex-wrap gap-2"><MocTrainingRequirementStatusBadge status={row.requirement_status} /><MocTrainingReadinessStatusBadge status={row.readiness_status} /><MocTrainingImpactLevelBadge level={row.impact_level} /><MocImplementationBlockerBadge value={row.implementation_blocker} /><MocClosureBlockerBadge value={row.closure_blocker} /><MocStartupBlockerBadge value={row.startup_blocker} /></div><PanelGrid><MiniField label="Requirement code" value={row.requirement_code} /><MiniField label="MOC" value={row.moc?.moc_number ?? row.moc_id} /><MiniField label="MOC title" value={row.moc?.title} /><MiniField label="Source" value={row.requirement_source} /><MiniField label="Training required" value={row.training_required} /><MiniField label="Safety critical" value={row.safety_critical} /></PanelGrid><p className="mt-3 text-sm text-[var(--psm-muted)]">{valueText(row.training_required_reason ?? row.requirement_description)}</p></TrainingCard><TrainingCard title="Counts"><PanelGrid><MiniField label="Affected workers" value={detail.affectedWorkers?.length ?? 0} /><MiniField label="Assignments" value={detail.assignments?.length ?? 0} /><MiniField label="Open blockers" value={detail.blockers?.filter((b) => b.blocker_status === 'Open').length ?? 0} /><MiniField label="Waivers" value={detail.waivers?.length ?? 0} /><MiniField label="Readiness checks" value={detail.readiness?.length ?? 0} /><MiniField label="History events" value={detail.history?.length ?? 0} /></PanelGrid></TrainingCard></div>;
}
