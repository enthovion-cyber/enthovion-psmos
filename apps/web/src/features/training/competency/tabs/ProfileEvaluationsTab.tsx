import { TrainingCard } from '../../shared/TrainingUi';
import { CompetencyGapTable } from '../CompetencyGapTable';
export function ProfileEvaluationsTab({ rows }: { rows: Record<string, any>[] }) { return <TrainingCard title="Competency Evaluations">{rows.length ? <CompetencyGapTable rows={rows.map((row) => ({ ...row, gap_title: row.reason ?? row.competency_status, gap_type: row.evidence_status, gap_severity: row.gap_severity, gap_status: row.gap_status }))} /> : <p className="text-sm text-[var(--psm-muted)]">No competency evaluations have run for this profile.</p>}</TrainingCard>; }
