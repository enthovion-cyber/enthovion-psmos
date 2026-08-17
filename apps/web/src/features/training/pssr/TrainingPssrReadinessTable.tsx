import { PssrHandoverBlockerBadge } from '../shared/PssrHandoverBlockerBadge';
import { PssrApprovalBlockerBadge } from '../shared/PssrApprovalBlockerBadge';
import { PssrStartupBlockerBadge } from '../shared/PssrStartupBlockerBadge';
import { PssrTrainingImpactLevelBadge } from '../shared/PssrTrainingImpactLevelBadge';
import { PssrTrainingReadinessStatusBadge } from '../shared/PssrTrainingReadinessStatusBadge';
import { ReadinessLink, SimpleTable, valueText } from './PssrTrainingPanelPrimitives';
import type { PssrTrainingReadiness } from '../types/pssr-training.types';

export function TrainingPssrReadinessTable({ rows = [] }: { rows?: PssrTrainingReadiness[] }) {
  return <SimpleTable rows={rows} columns={[
    { key: 'readiness_title', label: 'Readiness', render: (row) => <div><ReadinessLink row={row} /><p className="text-xs text-[var(--psm-muted)]">{valueText(row.readiness_code)}</p></div> },
    { key: 'pssr', label: 'PSSR', render: (row) => <div>{valueText(row.pssr?.pssr_number ?? row.pssr_id)}<p className="text-xs text-[var(--psm-muted)]">{valueText(row.pssr?.title)}</p></div> },
    { key: 'readiness_record_status', label: 'Status', render: (row) => <PssrTrainingReadinessStatusBadge status={row.readiness_record_status} /> },
    { key: 'readiness_status', label: 'Readiness', render: (row) => <PssrTrainingReadinessStatusBadge status={row.readiness_status} /> },
    { key: 'impact_level', label: 'Impact', render: (row) => <PssrTrainingImpactLevelBadge level={row.impact_level} /> },
    { key: 'blockers', label: 'Blockers', render: (row) => <div className="flex flex-wrap gap-1"><PssrApprovalBlockerBadge value={row.pssr_approval_blocker ?? row.approval_blocker} /><PssrHandoverBlockerBadge value={row.handover_blocker} /><PssrStartupBlockerBadge value={row.startup_blocker} /></div> },
    { key: 'due_date', label: 'Due', render: (row) => valueText(row.due_date) }
  ]} />;
}

