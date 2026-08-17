import { FoundationTab } from './WorkerOverviewTab';
export function WorkerHistoryTab({ rows }: { rows: Array<Record<string, any>> }) { return <FoundationTab title="Change History" message="Real immutable Training history events." rows={rows} />; }
