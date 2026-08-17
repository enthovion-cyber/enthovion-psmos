import { FoundationTab } from './WorkerOverviewTab';
export function WorkerAssignmentsTab({ rows }: { rows: Array<Record<string, any>> }) { return <FoundationTab title="Site / Unit / Area Assignments" message="No assignments exist yet. Add assignment through edit workflow or API permission." rows={rows} />; }
