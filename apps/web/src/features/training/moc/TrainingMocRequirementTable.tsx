import { MocClosureBlockerBadge } from '../shared/MocClosureBlockerBadge';
import { MocImplementationBlockerBadge } from '../shared/MocImplementationBlockerBadge';
import { MocStartupBlockerBadge } from '../shared/MocStartupBlockerBadge';
import { MocTrainingImpactLevelBadge } from '../shared/MocTrainingImpactLevelBadge';
import { MocTrainingReadinessStatusBadge } from '../shared/MocTrainingReadinessStatusBadge';
import { MocTrainingRequirementStatusBadge } from '../shared/MocTrainingRequirementStatusBadge';
import { RequirementLink, SimpleTable, valueText } from './MocTrainingPanelPrimitives';
import type { MocTrainingRequirement } from '../types/moc-training.types';

export function TrainingMocRequirementTable({ rows = [] }: { rows?: MocTrainingRequirement[] }) {
  return <SimpleTable rows={rows} columns={[
    { key: 'requirement_title', label: 'Requirement', render: (row) => <div><RequirementLink row={row} /><p className="text-xs text-[var(--psm-muted)]">{valueText(row.requirement_code)}</p></div> },
    { key: 'moc', label: 'MOC', render: (row) => <div>{valueText(row.moc?.moc_number ?? row.moc_id)}<p className="text-xs text-[var(--psm-muted)]">{valueText(row.moc?.title)}</p></div> },
    { key: 'requirement_status', label: 'Status', render: (row) => <MocTrainingRequirementStatusBadge status={row.requirement_status} /> },
    { key: 'readiness_status', label: 'Readiness', render: (row) => <MocTrainingReadinessStatusBadge status={row.readiness_status} /> },
    { key: 'impact_level', label: 'Impact', render: (row) => <MocTrainingImpactLevelBadge level={row.impact_level} /> },
    { key: 'blockers', label: 'Blockers', render: (row) => <div className="flex flex-wrap gap-1"><MocImplementationBlockerBadge value={row.implementation_blocker} /><MocClosureBlockerBadge value={row.closure_blocker} /><MocStartupBlockerBadge value={row.startup_blocker} /></div> },
    { key: 'due_date', label: 'Due', render: (row) => valueText(row.due_date) }
  ]} />;
}
