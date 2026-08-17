import { FoundationTab } from './WorkerOverviewTab';
export function WorkerCertificationsSummaryTab({ summary }: { summary: Record<string, any> }) { return <FoundationTab title="Certifications Summary" message={summary.emptyStates?.certifications ?? 'Certifications phase is coming next.'} />; }
