import { CompetencyGapTable } from './CompetencyGapTable';
export function WorkerCompetencyRequirementTable({ rows }: { rows: Record<string, any>[] }) { return <CompetencyGapTable rows={rows.map((row) => ({ ...row, gap_title: row.reason ?? row.competency_status, gap_type: row.evidence_status, gap_status: row.gap_status, gap_severity: row.gap_severity }))} />; }
