import { FoundationTab } from './WorkerOverviewTab';
export function WorkerTrainingSummaryTab({ summary }: { summary: Record<string, any> }) { return <FoundationTab title="Training Summary Foundation" message={summary.message ?? 'No training records exist yet.'} rows={[summary]} />; }
